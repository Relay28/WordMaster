package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "comprehension_results")
public class ComprehensionResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "session_id")
    private GameSessionEntity gameSession;
    
    @ManyToOne
    @JoinColumn(name = "student_id")
    private UserEntity student;
    
    @Column(columnDefinition = "TEXT")
    private String comprehensionQuestions;
    
    @Column(columnDefinition = "TEXT")
    private String comprehensionAnswers;
    
    @Column
    private Double comprehensionPercentage;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
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

    public String getComprehensionQuestions() {
        return comprehensionQuestions;
    }

    public void setComprehensionQuestions(String comprehensionQuestions) {
        this.comprehensionQuestions = comprehensionQuestions;
    }

    public String getComprehensionAnswers() {
        return comprehensionAnswers;
    }

    public void setComprehensionAnswers(String comprehensionAnswers) {
        this.comprehensionAnswers = comprehensionAnswers;
    }

    public Double getComprehensionPercentage() {
        return comprehensionPercentage;
    }

    public void setComprehensionPercentage(Double comprehensionPercentage) {
        this.comprehensionPercentage = comprehensionPercentage;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}