package cit.edu.wrdmstr.dto;

public class PlayerCardDTO {
    private Long id;           // ID of the PlayerCard entity
    private Long cardId;       // ID of the associated PowerupCard
    private String name;       // Name from PowerupCard
    private String description; // Description from PowerupCard
    private int pointsBonus;   // Points bonus from PowerupCard
    private String rarity;     // Rarity from PowerupCard
    private boolean used;      // Used status from PlayerCard

    // Default constructor
    public PlayerCardDTO() {
    }

    // Full constructor
    public PlayerCardDTO(Long id, Long cardId, String name, String description,
                         int pointsBonus, String rarity, boolean used) {
        this.id = id;
        this.cardId = cardId;
        this.name = name;
        this.description = description;
        this.pointsBonus = pointsBonus;
        this.rarity = rarity;
        this.used = used;
    }

    // Getters and setters
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

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}