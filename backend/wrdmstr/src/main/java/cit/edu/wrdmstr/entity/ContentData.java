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

    // Helper methods for managing relationships
    public void addWord(String word) {
        WordBankItem item = new WordBankItem(word, this);
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
    @Column(name = "background_image")
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