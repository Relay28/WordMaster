package cit.edu.wrdmstr.entity;



import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import java.util.Date;


@Entity
@Table(name = "grammar_results")
public class GrammarResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity gameSession;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;
    
    @Column(name = "perfect_count")
    private int perfectCount;
    
    @Column(name = "minor_errors_count")
    private int minorErrorsCount;
    
    @Column(name = "major_errors_count")
    private int majorErrorsCount;
    
    @Column(name = "grammar_streak")
    private int grammarStreak;
    
    @Column(name = "grammar_accuracy")
    private double grammarAccuracy;
    
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

    public int getPerfectCount() {
        return perfectCount;
    }

    public void setPerfectCount(int perfectCount) {
        this.perfectCount = perfectCount;
    }

    public int getMinorErrorsCount() {
        return minorErrorsCount;
    }

    public void setMinorErrorsCount(int minorErrorsCount) {
        this.minorErrorsCount = minorErrorsCount;
    }

    public int getMajorErrorsCount() {
        return majorErrorsCount;
    }

    public void setMajorErrorsCount(int majorErrorsCount) {
        this.majorErrorsCount = majorErrorsCount;
    }

    public int getGrammarStreak() {
        return grammarStreak;
    }

    public void setGrammarStreak(int grammarStreak) {
        this.grammarStreak = grammarStreak;
    }

    public double getGrammarAccuracy() {
        return grammarAccuracy;
    }

    public void setGrammarAccuracy(double grammarAccuracy) {
        this.grammarAccuracy = grammarAccuracy;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}