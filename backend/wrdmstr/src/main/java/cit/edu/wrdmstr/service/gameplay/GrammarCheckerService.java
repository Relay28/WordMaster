    package cit.edu.wrdmstr.service.gameplay;

    import cit.edu.wrdmstr.entity.ChatMessageEntity;
    import org.languagetool.JLanguageTool;
    import org.languagetool.language.AmericanEnglish;
    import org.languagetool.rules.RuleMatch;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;

    import java.util.ArrayList;
    import java.util.List;

    @Service
    public class GrammarCheckerService {

        private final JLanguageTool langTool;

        @Autowired
        public GrammarCheckerService(JLanguageTool langTool) {
            this.langTool = langTool;
        }

//        public GrammarCheckerService() {
//            try {
//                this.langTool = new JLanguageTool(new AmericanEnglish());
//            } catch (Exception e) {
//                System.err.println("LanguageTool initialization error: " + e.getMessage());
//                e.printStackTrace();
//                throw new RuntimeException("LanguageTool failed to initialize", e);
//            }
//        }

        public GrammarCheckResult checkGrammar(String text) {
            if (text == null || text.trim().isEmpty()) {
                return new GrammarCheckResult(ChatMessageEntity.MessageStatus.PERFECT, "Empty input");
            }

            try {
                List<RuleMatch> matches = langTool.check(text);
                if (matches.isEmpty()) {
                    return new GrammarCheckResult(ChatMessageEntity.MessageStatus.PERFECT, "No grammar errors detected");
                } else {
                    List<String> suggestions = new ArrayList<>();
                    for (int i = 0; i < Math.min(3, matches.size()); i++) {
                        RuleMatch match = matches.get(i);
                        String suggestion = String.format("Issue at position %d-%d: %s. Suggestion: %s",
                                match.getFromPos(), match.getToPos(), match.getMessage(), match.getSuggestedReplacements());
                        suggestions.add(suggestion);
                    }

                    ChatMessageEntity.MessageStatus status = matches.size() > 2
                            ? ChatMessageEntity.MessageStatus.MAJOR_ERRORS
                            : ChatMessageEntity.MessageStatus.MINOR_ERRORS;

                    return new GrammarCheckResult(status, String.join("\n", suggestions));
                }
            } catch (Exception e) {
                return new GrammarCheckResult(ChatMessageEntity.MessageStatus.MAJOR_ERRORS, "Error analyzing text");
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
