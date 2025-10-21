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
 * Grammar Checker Service using AI for lightweight grammar status checking
 * Optimized for production environments without GECToR Python service
 */
@Service
public class GrammarCheckerService {
    private static final Logger logger = LoggerFactory.getLogger(GrammarCheckerService.class);
    private final AIService aiService;
    
    @Value("${features.role-check.min-length:6}")
    private int roleCheckMinLength;
    @Value("${features.role-check.skip-duplicate.enabled:true}")
    private boolean skipDuplicateRoleChecks;
    @Value("${features.grammar.numbers.penalty.enabled:false}")
    private boolean numbersPenaltyEnabled;
    @Value("${features.grammar.numbers.penalty.points:10}")
    private int numbersPenaltyPoints;

    // Cache last normalized text per (role|context) to skip duplicate role_check calls
    private final ConcurrentMap<String, String> lastRoleContextText = new ConcurrentHashMap<>();

    public GrammarCheckerService(AIService aiService) {
        this.aiService = aiService;
    }

    /**
     * Simple grammar check using AI for status only
     */
    public GrammarCheckResult checkGrammar(String text) {
        try {
            String aiResponse = aiService.checkGrammarStatus(text);
            String[] parts = aiResponse.split("\\|", 2);
            MessageStatus status = parseStatusString(parts[0]);
            // Use detailed feedback for reports/admin view
            String feedback = generateDetailedFeedback(status);
            return new GrammarCheckResult(status, feedback);
        } catch (Exception e) {
            logger.error("Error in simple grammar check: " + e.getMessage(), e);
            return new GrammarCheckResult(MessageStatus.MINOR_ERRORS, 
                "Good effort! Your message is understandable but has minor issues with punctuation, spelling, or grammar.", false, false);
        }
    }
    
    /**
     * Enhanced grammar check with role appropriateness
     * Uses AI for both grammar status and role checking
     */
    public GrammarCheckResult checkGrammar(String text, String role, String contextDescription) {
        try {
            // Use AI for grammar status checking (now returns: STATUS | Tip)
            String aiResponse = aiService.checkGrammarStatus(text);
            String[] parts = aiResponse.split("\\|", 2);
            MessageStatus grammarStatus = parseStatusString(parts[0]);
            // Use detailed feedback for reports/admin view
            String detailedFeedback = generateDetailedFeedback(grammarStatus);
            
            // Use AI for role appropriateness checking
            boolean isRoleAppropriate = true;

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

            // Numeric penalty (override) if enabled and text has significant numeric content
            boolean numericTriggered = false;
            if (numbersPenaltyEnabled && text != null) {
                String raw = text.trim();
                int digits = 0;
                for (char c : raw.toCharArray()) if (Character.isDigit(c)) digits++;
                double ratio = raw.isEmpty() ? 0 : (double)digits / raw.length();
                // Trigger if >=1 digit AND (digit ratio >=20%) OR contains math operators adjacent to digits
                if (digits > 0 && (ratio >= 0.2 || containsDigitAdjacentToMathOperator(raw))) {
                    numericTriggered = true;
                }
            }

            // Build feedback message - use our concise tips instead of verbose AI feedback
            String feedback = detailedFeedback;
            MessageStatus finalStatus = grammarStatus;
            
            if (numericTriggered) {
                finalStatus = MessageStatus.MAJOR_ERRORS; // force downgrade
                feedback = "Numbers/maths not allowed. Please write words in English.";
            }

            // Log completion
            logger.debug("Grammar check completed using AI");

            return new GrammarCheckResult(finalStatus, feedback, isRoleAppropriate, numericTriggered);
            
        } catch (Exception e) {
            logger.error("Error in grammar check: " + e.getMessage(), e);
            return new GrammarCheckResult(MessageStatus.MINOR_ERRORS, 
                "Keep practicing! Your English is improving.", true, false);
        }
    }

    /**
     * Parse status string from AI response
     */
    private MessageStatus parseStatusString(String statusStr) {
        if (statusStr == null) return MessageStatus.MINOR_ERRORS;
        
        String upper = statusStr.toUpperCase().trim();
        if (upper.contains("PERFECT")) {
            return MessageStatus.PERFECT;
        } else if (upper.contains("MAJOR")) {
            return MessageStatus.MAJOR_ERRORS;
        } else {
            return MessageStatus.MINOR_ERRORS;
        }
    }

    /**
     * Generate detailed feedback for reports/admin view
     * These provide context and explanation for the student's performance
     */
    private String generateDetailedFeedback(MessageStatus status) {
        switch (status) {
            case PERFECT:
                return "Excellent work! Your sentence has perfect grammar, proper punctuation, and clear structure. This shows strong English language skills.";
            case MINOR_ERRORS:
                return "Good effort! Your message is understandable but has minor issues with punctuation, spelling, or grammar. Review capitalization, verb tenses, and sentence endings.";
            case MAJOR_ERRORS:
                return "This message needs improvement. Focus on forming complete sentences with a subject and verb. Check for proper word order, grammar rules, and spelling.";
            default:
                return "Continue practicing your English writing skills.";
        }
    }

    /**
     * Generate concise, actionable tips for gameplay display
     * These are short, specific suggestions shown during the game
     */
    private String generateSimpleFeedback(MessageStatus status) {
        switch (status) {
            case PERFECT:
                return "Perfect grammar!";
            case MINOR_ERRORS:
                return "Check punctuation and spelling";
            case MAJOR_ERRORS:
                return "Form a complete sentence with subject and verb";
            default:
                return "Try writing in complete sentences";
        }
    }

    /**
     * Checks if the text contains digits adjacent to math operators (e.g., "2+2=4")
     * Uses character-by-character analysis instead of regex for better performance
     */
    private boolean containsDigitAdjacentToMathOperator(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        
        char[] chars = text.toCharArray();
        for (int i = 0; i < chars.length - 1; i++) {
            // Check if current char is digit and next is operator
            if (Character.isDigit(chars[i]) && isMathOperator(chars[i+1])) {
                return true;
            }
            // Check if current char is operator and next is digit
            if (isMathOperator(chars[i]) && i+1 < chars.length && Character.isDigit(chars[i+1])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Helper method to check if a character is a common math operator
     */
    private boolean isMathOperator(char c) {
        return c == '+' || c == '-' || c == '*' || c == '/' || c == '=' || c == '%';
    }

    /**
     * Result class for grammar checking
     */
    public static class GrammarCheckResult {
        private final ChatMessageEntity.MessageStatus status;
        private final String feedback;
        private final boolean isRoleAppropriate;
        private final boolean numericPenaltyApplied;

        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback, boolean isRoleAppropriate, boolean numericPenaltyApplied) {
            this.status = status;
            this.feedback = feedback;
            this.isRoleAppropriate = isRoleAppropriate;
            this.numericPenaltyApplied = numericPenaltyApplied;
        }

        // Constructor for backward compatibility
        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback) {
            this(status, feedback, true, false); // Default
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

        public boolean isNumericPenaltyApplied() { return numericPenaltyApplied; }
    }
}
