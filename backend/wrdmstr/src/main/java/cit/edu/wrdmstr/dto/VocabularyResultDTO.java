package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;

public class VocabularyResultDTO {
    private Long id;
    private Long gameSessionId;
    private Long studentId;
    private String studentName;
    private int vocabularyScore;
    private List<String> usedWords;
    private List<String> usedAdvancedWords;
    private Date createdAt;
    
    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGameSessionId() {
        return gameSessionId;
    }

    public void setGameSessionId(Long gameSessionId) {
        this.gameSessionId = gameSessionId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public int getVocabularyScore() {
        return vocabularyScore;
    }

    public void setVocabularyScore(int vocabularyScore) {
        this.vocabularyScore = vocabularyScore;
    }

    public List<String> getUsedWords() {
        return usedWords;
    }

    public void setUsedWords(List<String> usedWords) {
        this.usedWords = usedWords;
    }

    public List<String> getUsedAdvancedWords() {
        return usedAdvancedWords;
    }

    public void setUsedAdvancedWords(List<String> usedAdvancedWords) {
        this.usedAdvancedWords = usedAdvancedWords;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}