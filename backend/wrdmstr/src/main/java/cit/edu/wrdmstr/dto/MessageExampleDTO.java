package cit.edu.wrdmstr.dto;

// For showing example messages with feedback
public class MessageExampleDTO {
    private String content;
    private String grammarStatus;
    private String feedback;
    // constructor, getters


    public MessageExampleDTO(String content, String grammarStatus, String feedback) {
        this.content = content;
        this.grammarStatus = grammarStatus;
        this.feedback = feedback;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getGrammarStatus() {
        return grammarStatus;
    }

    public void setGrammarStatus(String grammarStatus) {
        this.grammarStatus = grammarStatus;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
