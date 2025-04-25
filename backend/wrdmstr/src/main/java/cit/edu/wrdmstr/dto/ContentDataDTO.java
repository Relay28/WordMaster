package cit.edu.wrdmstr.dto;

import lombok.Data;

import java.util.List;

public class ContentDataDTO {
    private String backgroundImage;
    private List<WordBankItemDTO> wordBank;
    private List<RoleDTO> roles;

    public String getBackgroundImage() {
        return backgroundImage;
    }

    public void setBackgroundImage(String backgroundImage) {
        this.backgroundImage = backgroundImage;
    }

    public List<WordBankItemDTO> getWordBank() {
        return wordBank;
    }

    public void setWordBank(List<WordBankItemDTO> wordBank) {
        this.wordBank = wordBank;
    }

    public List<RoleDTO> getRoles() {
        return roles;
    }

    public void setRoles(List<RoleDTO> roles) {
        this.roles = roles;
    }
}