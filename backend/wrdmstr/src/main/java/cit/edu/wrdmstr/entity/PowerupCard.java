package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "powerup_cards")
public class PowerupCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int pointsBonus;

    @Column(nullable = false)
    private String triggerCondition; // e.g. "USE_ADJECTIVE", "USE_NOUN", "LONG_SENTENCE"

    @Column(nullable = false)
    private String rarity; // COMMON, UNCOMMON, RARE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_data_id")
    private ContentData contentData;

    // Getters and setters
    // ...


    public Long getId() {

        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(String triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public ContentData getContentData() {
        return contentData;
    }

    public void setContentData(ContentData contentData) {
        this.contentData = contentData;
    }
}