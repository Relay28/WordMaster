package cit.edu.wrdmstr.dto;

public class CardUseRequest {
    private Long cardId;
    private String message;

    // Getters and setters
    // ...


    public Long getCardId() {
        return cardId;
    }

    public void setCardId(Long cardId) {
        this.cardId = cardId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
