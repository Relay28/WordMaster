package cit.edu.wrdmstr.dto;

public class PlayerCardDTO {
    private Long id;
    private Long cardId;
    private String name;
    private String description;
    private int pointsBonus;
    private boolean used;

    // Getters and setters
    // ...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCardId() {
        return cardId;
    }

    public void setCardId(Long cardId) {
        this.cardId = cardId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getPointsBonus() {
        return pointsBonus;
    }

    public void setPointsBonus(int pointsBonus) {
        this.pointsBonus = pointsBonus;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}

