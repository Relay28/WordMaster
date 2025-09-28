package cit.edu.wrdmstr.service.gameplay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance grammar correction service using GECToR model
 * Replaces AI-based grammar checking for faster response times
 */
@Service
public class GectorGrammarService {
    private static final Logger logger = LoggerFactory.getLogger(GectorGrammarService.class);
    
    @Value("${gector.service.url:http://localhost:5001}")
    private String gectorServiceUrl;
    
    @Value("${gector.service.timeout:3000}")
    private int timeoutMs;
    
    @Value("${gector.cache.enabled:true}")
    private boolean cacheEnabled;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    // Local cache for frequent corrections
    private final Map<String, GrammarCorrectionResult> localCache = new ConcurrentHashMap<>();
    private final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
    private final long CACHE_TTL_MS = 300000; // 5 minutes
    
    // Fallback templates for encouraging feedback
    private final List<String> perfectFeedbacks = Arrays.asList(
        "✓ Excellent! Your grammar is spot-on.",
        "✓ Great job! Clear and well-written.",
        "✓ Perfect! Your English is very good.",
        "✓ Well done! No grammar issues found.",
        "✓ Outstanding! Your message is clear."
    );
    
    private final List<String> minorErrorFeedbacks = Arrays.asList(
        "✓ Good work! Just one small improvement found.",
        "✓ Nice job! Minor adjustment suggested.",
        "✓ Almost perfect! One tiny detail to fix.",
        "✓ Great effort! Small grammar improvement available.",
        "✓ Well written! Just a minor polish needed."
    );
    
    private final List<String> majorErrorFeedbacks = Arrays.asList(
        "💡 Let's improve this together! Several areas to work on.",
        "💡 Good start! Here are ways to make it even better.",
        "💡 Keep practicing! Some grammar improvements needed.",
        "💡 You're learning! Multiple areas for improvement found.",
        "💡 Great effort! Let's polish the grammar further."
    );
    
    public GectorGrammarService() {
        this.webClient = WebClient.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB
            .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Check grammar using GECToR service with caching and fallback
     */
    @Cacheable(value = "grammarCorrections", condition = "#cacheEnabled")
    public GrammarCorrectionResult checkGrammar(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new GrammarCorrectionResult(
                text, text, MessageStatus.PERFECT, 
                "✓ Message received!", new ArrayList<>(), 0
            );
        }
        
        String normalizedText = normalizeText(text);
        
        // Check local cache first
        if (cacheEnabled && localCache.containsKey(normalizedText)) {
            Long timestamp = cacheTimestamps.get(normalizedText);
            if (timestamp != null && (System.currentTimeMillis() - timestamp) < CACHE_TTL_MS) {
                logger.debug("Cache hit for text: {}", text.substring(0, Math.min(30, text.length())));
                return localCache.get(normalizedText);
            } else {
                // Remove expired cache entry
                localCache.remove(normalizedText);
                cacheTimestamps.remove(normalizedText);
            }
        }
        
        try {
            // Call GECToR service
            GrammarCorrectionResult result = callGectorService(text);
            
            // Cache successful results
            if (cacheEnabled && result != null) {
                localCache.put(normalizedText, result);
                cacheTimestamps.put(normalizedText, System.currentTimeMillis());
                
                // Cleanup old cache entries periodically
                if (localCache.size() > 1000) {
                    cleanupCache();
                }
            }
            
            return result;
            
        } catch (Exception e) {
            logger.warn("GECToR service failed, using fallback: {}", e.getMessage());
            return createFallbackResult(text);
        }
    }
    
    /**
     * Call GECToR microservice with timeout and retry
     */
    private GrammarCorrectionResult callGectorService(String text) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("text", text);
            
            return webClient.post()
                .uri(gectorServiceUrl + "/correct")
                .body(Mono.just(request), Map.class)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)))
                .map(this::parseGectorResponse)
                .block();
                
        } catch (WebClientException e) {
            logger.error("Failed to call GECToR service: {}", e.getMessage());
            throw new RuntimeException("GECToR service unavailable", e);
        }
    }
    
    /**
     * Parse GECToR service response
     */
    private GrammarCorrectionResult parseGectorResponse(String jsonResponse) {
        try {
            JsonNode response = objectMapper.readTree(jsonResponse);
            
            String originalText = response.get("original_text").asText();
            String correctedText = response.get("corrected_text").asText();
            String status = response.get("status").asText();
            String feedback = response.get("feedback").asText();
            int processingTime = response.get("processing_time_ms").asInt();
            
            // Parse errors
            List<String> errors = new ArrayList<>();
            JsonNode errorsNode = response.get("errors");
            if (errorsNode != null && errorsNode.isArray()) {
                for (JsonNode error : errorsNode) {
                    errors.add(error.get("type").asText());
                }
            }
            
            // Convert status
            MessageStatus messageStatus = parseStatus(status);
            
            return new GrammarCorrectionResult(
                originalText, correctedText, messageStatus, 
                feedback, errors, processingTime
            );
            
        } catch (Exception e) {
            logger.error("Failed to parse GECToR response: {}", e.getMessage());
            throw new RuntimeException("Invalid GECToR response", e);
        }
    }
    
    /**
     * Create fallback result when GECToR service is unavailable
     */
    private GrammarCorrectionResult createFallbackResult(String text) {
        // Simple rule-based fallback
        MessageStatus status = MessageStatus.MINOR_ERRORS; // Conservative fallback
        String feedback = getRandomFeedback(minorErrorFeedbacks) + " (Quick analysis)";
        
        // Basic checks for obvious issues
        if (text.length() < 10) {
            feedback = "💡 Try writing a bit more to practice your English!";
        } else if (!text.matches(".*[.!?]$")) {
            feedback = "💡 Good message! Remember to end with punctuation.";
        } else if (text.toLowerCase().equals(text) && text.length() > 20) {
            feedback = "💡 Great content! Try using capital letters for better style.";
        } else {
            status = MessageStatus.PERFECT;
            feedback = getRandomFeedback(perfectFeedbacks) + " (Quick check)";
        }
        
        return new GrammarCorrectionResult(
            text, text, status, feedback, new ArrayList<>(), 0
        );
    }
    
    /**
     * Convert GECToR status to MessageStatus
     */
    private MessageStatus parseStatus(String status) {
        if (status == null) return MessageStatus.MINOR_ERRORS;
        
        switch (status.toUpperCase()) {
            case "NO_ERRORS":
            case "PERFECT":
                return MessageStatus.PERFECT;
            case "MINOR_ERRORS":
                return MessageStatus.MINOR_ERRORS;
            case "MAJOR_ERRORS":
                return MessageStatus.MAJOR_ERRORS;
            default:
                return MessageStatus.MINOR_ERRORS;
        }
    }
    
    /**
     * Normalize text for consistent caching
     */
    private String normalizeText(String text) {
        if (text == null) return "";
        return text.trim().toLowerCase().replaceAll("\\s+", " ");
    }
    
    /**
     * Get random encouraging feedback
     */
    private String getRandomFeedback(List<String> feedbacks) {
        return feedbacks.get(new Random().nextInt(feedbacks.size()));
    }
    
    /**
     * Get feedback based on error severity
     */
    private String getFeedbackForSeverity(int errorCount) {
        if (errorCount == 0) {
            return getRandomFeedback(perfectFeedbacks);
        } else if (errorCount <= 2) {
            return getRandomFeedback(minorErrorFeedbacks);  
        } else {
            return getRandomFeedback(majorErrorFeedbacks);
        }
    }
    
    /**
     * Cleanup expired cache entries
     */
    private void cleanupCache() {
        long now = System.currentTimeMillis();
        List<String> keysToRemove = new ArrayList<>();
        
        for (Map.Entry<String, Long> entry : cacheTimestamps.entrySet()) {
            if ((now - entry.getValue()) > CACHE_TTL_MS) {
                keysToRemove.add(entry.getKey());
            }
        }
        
        for (String key : keysToRemove) {
            localCache.remove(key);
            cacheTimestamps.remove(key);
        }
        
        logger.debug("Cleaned {} expired cache entries", keysToRemove.size());
    }
    
    /**
     * Check if GECToR service is available
     */
    public boolean isServiceAvailable() {
        try {
            webClient.get()
                .uri(gectorServiceUrl + "/health")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(2000))
                .block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Result class for grammar correction
     */
    public static class GrammarCorrectionResult {
        private final String originalText;
        private final String correctedText;
        private final MessageStatus status;
        private final String feedback;
        private final List<String> errorTypes;
        private final int processingTimeMs;
        
        public GrammarCorrectionResult(String originalText, String correctedText, 
                                     MessageStatus status, String feedback, 
                                     List<String> errorTypes, int processingTimeMs) {
            this.originalText = originalText;
            this.correctedText = correctedText;
            this.status = status;
            this.feedback = feedback;
            this.errorTypes = errorTypes != null ? errorTypes : new ArrayList<>();
            this.processingTimeMs = processingTimeMs;
        }
        
        // Getters
        public String getOriginalText() { return originalText; }
        public String getCorrectedText() { return correctedText; }
        public MessageStatus getStatus() { return status; }
        public String getFeedback() { return feedback; }
        public List<String> getErrorTypes() { return errorTypes; }
        public int getProcessingTimeMs() { return processingTimeMs; }
        public boolean hasCorrections() { return !originalText.equals(correctedText); }
        
        @Override
        public String toString() {
            return String.format("GrammarResult{status=%s, hasCorrections=%s, time=%dms}", 
                               status, hasCorrections(), processingTimeMs);
        }
    }
}
