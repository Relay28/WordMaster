package cit.edu.wrdmstr.dto;

import java.util.Date;

public class ChatMessageDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private Date timestamp;
    private String grammarStatus;
    private String grammarFeedback;
    private boolean containsWordBomb;
    private String wordUsed;
    private String wordVariations; // Actual text variations for frontend bolding
    private String role;
    private boolean roleAppropriate; // Add this field

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getGrammarStatus() {
        return grammarStatus;
    }

    public void setGrammarStatus(String grammarStatus) {
        this.grammarStatus = grammarStatus;
    }

    public String getGrammarFeedback() {
        return grammarFeedback;
    }

    public void setGrammarFeedback(String grammarFeedback) {
        this.grammarFeedback = grammarFeedback;
    }

    public boolean isContainsWordBomb() {
        return containsWordBomb;
    }

    public void setContainsWordBomb(boolean containsWordBomb) {
        this.containsWordBomb = containsWordBomb;
    }

    public String getWordUsed() {
        return wordUsed;
    }

    public void setWordUsed(String wordUsed) {
        this.wordUsed = wordUsed;
    }

    public String getWordVariations() {
        return wordVariations;
    }

    public void setWordVariations(String wordVariations) {
        this.wordVariations = wordVariations;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isRoleAppropriate() {
        return roleAppropriate;
    }

    public void setRoleAppropriate(boolean roleAppropriate) {
        this.roleAppropriate = roleAppropriate;
    }
}