package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import org.springframework.stereotype.Service;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Enhanced Grammar Checker Service using GECToR for fast grammar correction
 * and AI only for role appropriateness checking to reduce latency
 */
@Service
public class GrammarCheckerService {
    private static final Logger logger = LoggerFactory.getLogger(GrammarCheckerService.class);
    private final AIService aiService;
    private final GectorGrammarService gectorGrammarService;
    @Value("${features.role-check.min-length:6}")
    private int roleCheckMinLength;
    @Value("${features.role-check.skip-duplicate.enabled:true}")
    private boolean skipDuplicateRoleChecks;

    // Cache last normalized text per (role|context) to skip duplicate role_check calls
    private final ConcurrentMap<String, String> lastRoleContextText = new ConcurrentHashMap<>();

    public GrammarCheckerService(AIService aiService, GectorGrammarService gectorGrammarService) {
        this.aiService = aiService;
        this.gectorGrammarService = gectorGrammarService;
    }

    /**
     * Simple grammar check using GECToR only
     */
    public GrammarCheckResult checkGrammar(String text) {
        GectorGrammarService.GrammarCorrectionResult gectorResult = gectorGrammarService.checkGrammar(text);
        return new GrammarCheckResult(gectorResult.getStatus(), gectorResult.getFeedback());
    }
    
    /**
     * Enhanced grammar check with role appropriateness
     * Uses GECToR for grammar (fast) and AI only for role checking
     */
    public GrammarCheckResult checkGrammar(String text, String role, String contextDescription) {
        try {
            // Use GECToR for grammar correction (much faster than AI)
            GectorGrammarService.GrammarCorrectionResult gectorResult = gectorGrammarService.checkGrammar(text);
            
            // Use AI ONLY for role appropriateness checking
            boolean isRoleAppropriate = true;
            String roleFeedback = "";

            if (role != null && !role.isEmpty() && contextDescription != null && text != null) {
                String normalized = text.trim().toLowerCase().replaceAll("\\s+", " ");
                boolean lengthOk = normalized.length() >= roleCheckMinLength;
                String key = role + '|' + contextDescription;
                boolean isDuplicate = skipDuplicateRoleChecks && normalized.equals(lastRoleContextText.get(key));

                if (lengthOk && !isDuplicate) {
                Map<String, Object> request = new HashMap<>();
                request.put("task", "role_check");
                request.put("text", text);
                request.put("role", role);
                request.put("context", contextDescription);

                try {
                    String roleCheckResponse = aiService.callAIModel(request).getResult();
                    if (roleCheckResponse != null) {
                        String trimmedResponse = roleCheckResponse.trim();
                        String upperResponse = trimmedResponse.toUpperCase();

                        // Strict: only treat as appropriate if starts with APPROPRIATE
                        if (upperResponse.startsWith("APPROPRIATE")) {
                            isRoleAppropriate = true;
                        } else if (upperResponse.startsWith("NOT APPROPRIATE")) {
                            isRoleAppropriate = false;
                        } else {
                            // Unknown format -> default to appropriate but log
                            logger.debug("Unrecognized role_check format: {}", trimmedResponse);
                            isRoleAppropriate = true;
                        }
                        roleFeedback = roleCheckResponse;
                    }
                    // Update last seen on success path
                    lastRoleContextText.put(key, normalized);
                } catch (Exception roleCheckException) {
                    logger.warn("Role check failed, assuming appropriate: {}", roleCheckException.getMessage());
                    isRoleAppropriate = true; // Default to appropriate if role check fails
                }
                } else {
                    if (!lengthOk) {
                        logger.debug("Skipping role_check (below min length {})", roleCheckMinLength);
                    } else if (isDuplicate) {
                        logger.debug("Skipping role_check (duplicate text for role/context)");
                    }
                }
            }

            // Combine grammar feedback with role feedback if needed
            String enhancedFeedback = gectorResult.getFeedback();
            if (!roleFeedback.isEmpty()) {
                // Always append a concise role line; trim to 140 chars
                String concise = roleFeedback.replaceAll("\n", " ").trim();
                if (concise.length() > 140) concise = concise.substring(0,137) + "...";
                enhancedFeedback += "\nRole: " + concise;
            }

            // Log performance improvement
            logger.debug("Grammar check completed in {}ms using GECToR", gectorResult.getProcessingTimeMs());

            return new GrammarCheckResult(gectorResult.getStatus(), enhancedFeedback, isRoleAppropriate);
            
        } catch (Exception e) {
            logger.error("Error in grammar check: " + e.getMessage(), e);
            return new GrammarCheckResult(MessageStatus.MINOR_ERRORS, 
                "Analysis temporarily unavailable. Keep practicing!", false);
        }
    }

    /**
     * Result class for grammar checking
     */
    public static class GrammarCheckResult {
        private final ChatMessageEntity.MessageStatus status;
        private final String feedback;
        private final boolean isRoleAppropriate;

        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback, boolean isRoleAppropriate) {
            this.status = status;
            this.feedback = feedback;
            this.isRoleAppropriate = isRoleAppropriate;
        }

        // Constructor for backward compatibility
        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback) {
            this(status, feedback, true); // Default to appropriate for backward compatibility
        }

        public ChatMessageEntity.MessageStatus getStatus() {
            return status;
        }

        public String getFeedback() {
            return feedback;
        }

        public boolean isRoleAppropriate() {
            return isRoleAppropriate;
        }
    }
}
