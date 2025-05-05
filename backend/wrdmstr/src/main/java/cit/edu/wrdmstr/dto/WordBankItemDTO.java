package cit.edu.wrdmstr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


public class WordBankItemDTO {
    private Long id;
    private String word;

    public WordBankItemDTO(Long id, String word) {
        this.id=id;
        this.word=word;
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
}