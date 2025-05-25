package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "word_bank_items")
public class WordBankItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private String word;

    private int complexity;
    
    @Column(nullable = false)
    private String rarity = "COMMON";
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String exampleUsage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_data_id")
    private ContentData contentData;

    public WordBankItem() {}

    public WordBankItem(String word, ContentData contentData) {
        this.word = word;
        this.contentData = contentData;
        this.complexity = 1;
        this.rarity = "COMMON";
        this.description = "";
        this.exampleUsage = "";
    }

    public WordBankItem(String word, ContentData contentData, String description, String exampleUsage) {
        this.word = word;
        this.contentData = contentData;
        this.complexity = 1;
        this.rarity = "COMMON";
        this.description = description;
        this.exampleUsage = exampleUsage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public ContentData getContentData() {
        return contentData;
    }

    public void setContentData(ContentData contentData) {
        this.contentData = contentData;
    }

    public void setComplexity(int complexity) {
        this.complexity = complexity;
    }

    public int getComplexity() {
        return complexity;
    }

    public String getRarity() {
        return rarity;
    }
    
    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExampleUsage() {
        return exampleUsage;
    }

    public void setExampleUsage(String exampleUsage) {
        this.exampleUsage = exampleUsage;
    }
}