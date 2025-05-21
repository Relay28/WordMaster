package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "content_data")
public class ContentData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "contentData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WordBankItem> wordBank = new ArrayList<>();

    @OneToMany(mappedBy = "contentData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Role> roles = new ArrayList<>();

    @OneToMany(mappedBy = "contentData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PowerupCard> powerupCards = new ArrayList<>();

    // ... existing methods ...

    // Add these methods for managing power-up cards
    public List<PowerupCard> getPowerupCards() {
        return powerupCards;
    }

    public void setPowerupCards(List<PowerupCard> powerupCards) {
        this.powerupCards = powerupCards;
    }

    public void addPowerupCard(PowerupCard card) {
        powerupCards.add(card);
        card.setContentData(this);
    }

    public void removePowerupCard(PowerupCard card) {
        powerupCards.remove(card);
        card.setContentData(null);
    }
    public void addWord(String word) {
        // Create WordBankItem with a default complexity of 1
        WordBankItem item = new WordBankItem(word, this);
        item.setComplexity(1); // Set a default complexity
        wordBank.add(item);
    }

    public void addWord(String word, String description, String exampleUsage) {
    WordBankItem item = new WordBankItem(word, this, description, exampleUsage);
    item.setComplexity(1);
    item.setRarity("COMMON");
    wordBank.add(item);
}

    public List<WordBankItem> getWordBank() {
        return wordBank;
    }

    public void setWordBank(List<WordBankItem> wordBank) {
        this.wordBank = wordBank;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }

    public void addRole(String roleName) {
        Role role = new Role(roleName, this);
        roles.add(role);
    }



    @Lob
    @Column(name = "background_image", columnDefinition = "LONGTEXT")
    private String backgroundImage;

    @OneToOne
    @JoinColumn(name = "content_id")
    private ContentEntity content;



    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getBackgroundImage() {
        return backgroundImage;
    }

    public void setBackgroundImage(String backgroundImage) {
        this.backgroundImage = backgroundImage;
    }

    public ContentEntity getContent() {
        return content;
    }

    public void setContent(ContentEntity content) {
        this.content = content;
    }
}