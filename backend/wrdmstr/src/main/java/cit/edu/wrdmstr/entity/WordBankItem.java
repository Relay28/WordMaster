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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_data_id")
    private ContentData contentData;

    public WordBankItem() {}

    public WordBankItem(String word, ContentData contentData) {
        this.word = word;
        this.contentData = contentData;
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


}