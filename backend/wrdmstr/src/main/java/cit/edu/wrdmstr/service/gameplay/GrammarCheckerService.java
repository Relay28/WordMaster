    package cit.edu.wrdmstr.service.gameplay;

    import cit.edu.wrdmstr.entity.ChatMessageEntity;
    import org.languagetool.JLanguageTool;
    import org.languagetool.language.AmericanEnglish;
    import org.languagetool.rules.RuleMatch;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;
    import cit.edu.wrdmstr.service.ai.AIService;
    import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
    import java.util.ArrayList;
    import java.util.List;
    @Service
    public class GrammarCheckerService {
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

            return new GrammarCheckResult(status, aiFeedback);
        }

        private MessageStatus determineStatusFromFeedback(String feedback) {
            // Implement logic to determine severity based on AI feedback
            if (feedback.contains("no errors")) {
                return MessageStatus.PERFECT;
            } else if (feedback.contains("minor errors")) {
                return MessageStatus.MINOR_ERRORS;
            } else {
                return MessageStatus.MAJOR_ERRORS;
            }
        }

        public static class GrammarCheckResult {
            private final ChatMessageEntity.MessageStatus status;
            private final String feedback;

            public GrammarCheckResult(ChatMessageEntity.MessageStatus status, String feedback) {
                this.status = status;
                this.feedback = feedback;
            }

            public ChatMessageEntity.MessageStatus getStatus() {
                return status;
            }

            public String getFeedback() {
                return feedback;
            }
        }
    }
