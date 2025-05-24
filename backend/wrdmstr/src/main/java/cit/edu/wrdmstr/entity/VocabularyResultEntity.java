package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "vocabulary_results")
public class VocabularyResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity gameSession;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;
    
    @Column(name = "vocabulary_score")
    private int vocabularyScore;
    
    @Lob
    @Column(name = "used_words", columnDefinition = "TEXT")
    private String usedWords;
    
    @Lob
    @Column(name = "used_advanced_words", columnDefinition = "TEXT")
    private String usedAdvancedWords;
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false)
    private Date createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
    }
    
    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GameSessionEntity getGameSession() {
        return gameSession;
    }

    public void setGameSession(GameSessionEntity gameSession) {
        this.gameSession = gameSession;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }

    public int getVocabularyScore() {
        return vocabularyScore;
    }

    public void setVocabularyScore(int vocabularyScore) {
        this.vocabularyScore = vocabularyScore;
    }

    public String getUsedWords() {
        return usedWords;
    }

    public void setUsedWords(String usedWords) {
        this.usedWords = usedWords;
    }

    public String getUsedAdvancedWords() {
        return usedAdvancedWords;
    }

    public void setUsedAdvancedWords(String usedAdvancedWords) {
        this.usedAdvancedWords = usedAdvancedWords;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    
    // Helper methods to convert string lists to/from string
    public List<String> getUsedWordsList() {
        if (usedWords == null || usedWords.isEmpty()) {
            return new ArrayList<>();
        }
        return List.of(usedWords.split(","));
    }
    
    public List<String> getUsedAdvancedWordsList() {
        if (usedAdvancedWords == null || usedAdvancedWords.isEmpty()) {
            return new ArrayList<>();
        }
        return List.of(usedAdvancedWords.split(","));
    }
    
    public void setUsedWordsList(List<String> words) {
        this.usedWords = String.join(",", words);
    }
    
    public void setUsedAdvancedWordsList(List<String> words) {
        this.usedAdvancedWords = String.join(",", words);
    }
}