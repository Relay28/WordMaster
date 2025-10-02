package cit.edu.wrdmstr.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WordSubmissionDTO {
    private String word;

    private Long sessionId;
    private Long playerId;
    /** Optional client-side optimistic message id used to match optimistic UI messages */
    private String clientMessageId;

    // Getters and setters
    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }



    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public String getClientMessageId() {
        return clientMessageId;
    }

    public void setClientMessageId(String clientMessageId) {
        this.clientMessageId = clientMessageId;
    }
}