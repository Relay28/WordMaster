package cit.edu.wrdmstr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


public class WordBankItemDTO {
    private Long id;
    private String word;
    private String description;
    private String exampleUsage;

    public WordBankItemDTO(Long id, String word) {
        this.id = id;
        this.word = word;
    }
    
    public WordBankItemDTO(Long id, String word, String description, String exampleUsage) {
        this.id = id;
        this.word = word;
        this.description = description;
        this.exampleUsage = exampleUsage;
    }
    
    public WordBankItemDTO() {
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