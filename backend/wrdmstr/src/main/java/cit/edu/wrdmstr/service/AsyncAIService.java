package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.AiStreamMessage;
import org.languagetool.JLanguageTool;
import org.languagetool.language.AmericanEnglish;
import org.languagetool.rules.RuleMatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CachePut;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncAIService {
    private static final Logger logger = LoggerFactory.getLogger(AsyncAIService.class);

    private final AIService aiService;
    private final SimpMessagingTemplate simp;

    private final JLanguageTool langTool;
    @Value("${features.quick-grammar.enabled:true}")
    private boolean quickGrammarEnabled;

    @Autowired
    public AsyncAIService(AIService aiService,SimpMessagingTemplate simp) {
        this.aiService = aiService;
        this.simp = simp;
        this.langTool = new JLanguageTool(new AmericanEnglish());
    }

    // normalizePrompt retained for possible future cache key strategies
    private String normalizePrompt(String prompt) {
        if (prompt == null) return "";
        return prompt.trim().toLowerCase().replaceAll("\\s+", " ");
    }
    
    @Cacheable(value = "aiResponses", key = "#prompt", unless = "#result.isEmpty()")
    public Optional<String> lookupResponse(String prompt) {
        return Optional.empty(); // Initial empty result, Spring Cache will handle caching
    }
    
    @CachePut(value = "aiResponses", key = "#prompt")
    public String cacheResponse(String prompt, String response) {
        return response; // Spring Cache will handle storing the response
    }

    // Quick local grammar check using LanguageTool. Returns nullable quick feedback.
    public String runLanguageToolQuick(String text) {
        if (!quickGrammarEnabled) {
            return null; // Feature disabled
        }
        try {
            List<RuleMatch> matches = langTool.check(text);
            if (matches == null || matches.isEmpty()) {
                return "NO_ERRORS - Great job! ✓ Clear sentence.";
            }
            // Provide one concise tip
            RuleMatch first = matches.get(0);
            String msg = first.getMessage();
            return "MINOR_ERRORS - " + (msg.length() > 80 ? msg.substring(0, 77) + "..." : msg);
        } catch (Exception e) {
            logger.debug("LanguageTool error: {}", e.getMessage());
            return null;
        }
    }

    @Async("aiTaskExecutor")
    public CompletableFuture<String> callAIModelAsync(Map<String, Object> request, String sessionId) {
        String prompt = request.getOrDefault("text", "").toString();
        
        // Check cache first
        Optional<String> cached = lookupResponse(prompt);
        if (cached.isPresent()) {
            if (sessionId != null) {
                simp.convertAndSend("/topic/ai/" + sessionId, 
                    new AiStreamMessage("final", cached.get()));
            }
            return CompletableFuture.completedFuture(cached.get());
        }

        // Optional quick grammar check with LanguageTool (feature flagged)
        if (quickGrammarEnabled) {
            String lt = runLanguageToolQuick(prompt);
            if (lt != null) {
                if (sessionId != null) {
                    simp.convertAndSend("/topic/ai/" + sessionId, 
                        new AiStreamMessage("partial", lt));
                }
                if (!lt.startsWith("NO_ERRORS")) {
                    logger.debug("Grammar check found issues, proceeding to AI analysis");
                }
            }
        }

        // Get AI response
        String result = aiService.callAIModel(request).getResult();

        // Stream results if session exists
        if (sessionId != null) {
            streamResponse(result, sessionId);
        }

        // Cache the result
        cacheResponse(prompt, result);

        return CompletableFuture.completedFuture(result);
    }

    private void streamResponse(String result, String sessionId) {
        try {
            // Stream by sentences for progressive updates
            String[] parts = result.split("(?<=[.?!])\\s+");
            for (int i = 0; i < parts.length; i++) {
                String part = parts[i].trim();
                if (!part.isEmpty()) {
                    simp.convertAndSend("/topic/ai/" + sessionId, 
                        new AiStreamMessage(i == parts.length - 1 ? "final" : "partial", part));
                    // Small delay for client rendering
                    try { 
                        Thread.sleep(80); 
                    } catch (InterruptedException e) { 
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to stream via WebSocket: {}", e.getMessage());
        }
    }
}
