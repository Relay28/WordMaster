package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import org.languagetool.JLanguageTool;
import org.languagetool.language.AmericanEnglish;
import org.languagetool.rules.RuleMatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class GrammarCheckerService {
    private static final Logger logger = LoggerFactory.getLogger(GrammarCheckerService.class);
    private final AIService aiService;

    @Autowired
    public GrammarCheckerService(AIService aiService) {
        this.aiService = aiService;
    }

    public GrammarCheckResult checkGrammar(String text) {
        // Get AI-powered feedback
        String aiFeedback = aiService.getGrammarFeedback(text);

        // Parse feedback to determine status
        MessageStatus status = determineStatusFromFeedback(aiFeedback);

        // Add role-specific context to feedback
        String enhancedFeedback = aiFeedback;

        return new GrammarCheckResult(status, enhancedFeedback);
    }    // Modify the checkGrammar method to include role checking
    public GrammarCheckResult checkGrammar(String text, String role, String contextDescription) {
        try {
            // Get AI-powered grammar feedback
            String aiFeedback = aiService.getGrammarFeedback(text);

            // Parse feedback to determine status
            MessageStatus status = determineStatusFromFeedback(aiFeedback);

            // Check role appropriateness if role provided
            boolean isRoleAppropriate = false;
            String roleFeedback = "";

            if (role != null && !role.isEmpty() && contextDescription != null) {
                Map<String, Object> request = new HashMap<>();
                request.put("task", "role_check");
                request.put("text", text);
                request.put("role", role);
                request.put("context", contextDescription);

                String roleCheckResponse = aiService.callAIModel(request).getResult();
                
                // Check for "APPROPRIATE" at the start of the response
                isRoleAppropriate = roleCheckResponse != null && 
                    (roleCheckResponse.startsWith("APPROPRIATE") || 
                     roleCheckResponse.toLowerCase().startsWith("appropriate"));
                    
                roleFeedback = roleCheckResponse != null ? roleCheckResponse : "";
            } else {
                // If no role or context, assume appropriate
                isRoleAppropriate = true;
            }

            // Combine feedback
            String enhancedFeedback = aiFeedback;
            if (!roleFeedback.isEmpty()) {
                enhancedFeedback += "\n\nRole feedback: " + roleFeedback;
            }

            return new GrammarCheckResult(status, enhancedFeedback, isRoleAppropriate);
        } catch (Exception e) {
            // Better error handling
            logger.error("Error checking grammar: " + e.getMessage(), e);
            return new GrammarCheckResult(MessageStatus.MINOR_ERRORS, 
                "Grammar check encountered an error. Please try again.", false);
        }
    }    private MessageStatus determineStatusFromFeedback(String feedback) {
        if (feedback == null) {
            return MessageStatus.MINOR_ERRORS;
        }
        
        String lowerFeedback = feedback.toLowerCase();
        
        // First check for exact match of the classification at the beginning
        if (feedback.startsWith("NO ERRORS") || lowerFeedback.startsWith("no errors")) {
            return MessageStatus.PERFECT;
        } else if (feedback.startsWith("MINOR ERRORS") || lowerFeedback.startsWith("minor errors")) {
            return MessageStatus.MINOR_ERRORS;
        } else if (feedback.startsWith("MAJOR ERRORS") || lowerFeedback.startsWith("major errors")) {
            return MessageStatus.MAJOR_ERRORS;
        }
        
        // Fall back to contains check if no exact match at beginning
        if (lowerFeedback.contains("no errors") || 
            lowerFeedback.contains("perfect") || 
            lowerFeedback.contains("correct")) {
            return MessageStatus.PERFECT;
        } else if (lowerFeedback.contains("minor errors") || 
                   lowerFeedback.contains("small issues") || 
                   lowerFeedback.contains("slight mistakes")) {
            return MessageStatus.MINOR_ERRORS;
        } else {
            return MessageStatus.MAJOR_ERRORS;
        }
    }

    // Update the GrammarCheckResult class to include role appropriateness
    public static class GrammarCheckResult {
        private final ChatMessageEntity.MessageStatus status;
        private final String feedback;
        private final boolean isRoleAppropriate;

        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback, boolean isRoleAppropriate) {
            this.status = status;
            this.feedback = feedback;
            this.isRoleAppropriate = isRoleAppropriate;
        }

        // Add constructor for backward compatibility
        public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback) {
            this(status, feedback, false);
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
