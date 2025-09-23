package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.AiStreamMessage;
import cit.edu.wrdmstr.model.AiCacheEntry;
import cit.edu.wrdmstr.repository.AiCacheRepository;
import org.apache.commons.codec.digest.DigestUtils;
import org.languagetool.JLanguageTool;
import org.languagetool.language.AmericanEnglish;
import org.languagetool.rules.RuleMatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Service
public class AsyncAIService {
    private static final Logger logger = LoggerFactory.getLogger(AsyncAIService.class);

    private final AIService aiService;
    private final AiCacheRepository cacheRepository;
    private final SimpMessagingTemplate simp;

    private final JLanguageTool langTool;

    @Autowired
    public AsyncAIService(AIService aiService, AiCacheRepository cacheRepository, SimpMessagingTemplate simp) {
        this.aiService = aiService;
        this.cacheRepository = cacheRepository;
        this.simp = simp;
        this.langTool = new JLanguageTool(new AmericanEnglish());
    }

    private String normalizePrompt(String prompt) {
        if (prompt == null) return "";
        return prompt.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    private String hashPrompt(String normalized) {
        return DigestUtils.sha256Hex(normalized);
    }

    public Optional<String> lookupCache(String prompt) {
        String h = hashPrompt(normalizePrompt(prompt));
        Optional<AiCacheEntry> found = cacheRepository.findByPromptHash(h);
        if (found.isPresent()) {
            AiCacheEntry e = found.get();
            if (e.getExpiresAt() == null || e.getExpiresAt().isAfter(LocalDateTime.now())) {
                return Optional.ofNullable(e.getResponse());
            }
        }
        return Optional.empty();
    }

    public void storeCache(String prompt, String response) {
        String normalized = normalizePrompt(prompt);
        String hash = hashPrompt(normalized);
        AiCacheEntry entry = new AiCacheEntry();
        entry.setPromptHash(hash);
        entry.setPromptText(prompt);
        entry.setResponse(response);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setExpiresAt(LocalDateTime.now().plusDays(30));
        try {
            cacheRepository.save(entry);
        } catch (Exception e) {
            logger.warn("Failed to store AI cache: {}", e.getMessage());
        }
    }

    // Quick local grammar check using LanguageTool. Returns nullable quick feedback.
    public String runLanguageToolQuick(String text) {
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
        // If cache hit, return quickly
        String prompt = request.getOrDefault("text", "").toString();
        Optional<String> cached = lookupCache(prompt);
        if (cached.isPresent()) {
            // Optionally broadcast cached quick result
            if (sessionId != null) {
                simp.convertAndSend("/topic/ai/" + sessionId, new AiStreamMessage("final", cached.get()));
            }
            return CompletableFuture.completedFuture(cached.get());
        }

        // Run LanguageTool quick check and publish immediately if helpful
        String lt = runLanguageToolQuick(prompt);
        if (lt != null && lt.startsWith("NO_ERRORS")) {
            if (sessionId != null) {
                simp.convertAndSend("/topic/ai/" + sessionId, new AiStreamMessage("partial", lt));
            }
            // still call Gemini in background for richer feedback
        } else if (lt != null) {
            if (sessionId != null) {
                simp.convertAndSend("/topic/ai/" + sessionId, new AiStreamMessage("partial", lt));
            }
        }

        // Call the blocking AIService.callAIModel but inside async thread
        String result = aiService.callAIModel(request).getResult();

        // Broadcast result in WebSocket if session provided
        if (sessionId != null) {
            try {
                // Stream by sentences for perceived progress
                String[] parts = result.split("(?<=[.?!])\\s+");
                for (int i = 0; i < parts.length; i++) {
                    String part = parts[i].trim();
                    if (!part.isEmpty()) {
                        simp.convertAndSend("/topic/ai/" + sessionId, new AiStreamMessage(i == parts.length - 1 ? "final" : "partial", part));
                        // small delay to allow the client to render incremental pieces
                        try { Thread.sleep(80); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to stream via WebSocket: {}", e.getMessage());
            }
        }

        // Persist in cache
        try { storeCache(prompt, result); } catch (Exception e) { logger.debug("Cache store failed: {}", e.getMessage()); }

        return CompletableFuture.completedFuture(result);
    }
}
