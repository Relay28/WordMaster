package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "teacher_feedback")
public class TeacherFeedbackEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "game_session_id")
    private GameSessionEntity gameSession;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private UserEntity student;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    @Column(columnDefinition = "TEXT")
    private String feedback;
    
    @Column(name = "comprehension_score")
    private Integer comprehensionScore; // 1-5 or similar scale
    
    @Column(name = "participation_score")
    private Integer participationScore;
    
    @Column(name = "language_use_score")
    private Integer languageUseScore;
    
    @Column(name = "role_adherence_score")
    private Integer roleAdherenceScore;
    
    @Column(name = "overall_grade")
    private String overallGrade; // A, B, C, etc. or numeric

    @Column(name = "created_at")
    private Date createdAt;
    
    @Column(name = "updated_at")
    private Date updatedAt;
    
    @Column(name = "ai_suggested_feedback", columnDefinition = "TEXT")
    private String aiSuggestedFeedback;
    
    @Column(name = "comprehension_questions", columnDefinition = "TEXT")
    private String comprehensionQuestions; // Stored as JSON string

    @Column(name = "comprehension_answers", columnDefinition = "TEXT")
    private String comprehensionAnswers; // Stored as JSON string

    @Column(name = "comprehension_percentage")
    private Double comprehensionPercentage;

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

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Integer getComprehensionScore() {
        return comprehensionScore;
    }

    public void setComprehensionScore(Integer comprehensionScore) {
        this.comprehensionScore = comprehensionScore;
    }

    public Integer getParticipationScore() {
        return participationScore;
    }

    public void setParticipationScore(Integer participationScore) {
        this.participationScore = participationScore;
    }

    public Integer getLanguageUseScore() {
        return languageUseScore;
    }

    public void setLanguageUseScore(Integer languageUseScore) {
        this.languageUseScore = languageUseScore;
    }

    public Integer getRoleAdherenceScore() {
        return roleAdherenceScore;
    }

    public void setRoleAdherenceScore(Integer roleAdherenceScore) {
        this.roleAdherenceScore = roleAdherenceScore;
    }

    public String getOverallGrade() {
        return overallGrade;
    }

    public void setOverallGrade(String overallGrade) {
        this.overallGrade = overallGrade;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getAiSuggestedFeedback() {
        return aiSuggestedFeedback;
    }

    public void setAiSuggestedFeedback(String aiSuggestedFeedback) {
        this.aiSuggestedFeedback = aiSuggestedFeedback;
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

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }
}