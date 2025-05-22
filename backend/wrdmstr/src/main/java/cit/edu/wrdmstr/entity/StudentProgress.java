package cit.edu.wrdmstr.entity;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.ProgressSnapshot;
import cit.edu.wrdmstr.entity.UserEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "student_progress")
public class StudentProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity session;

    @Column(name = "turn_completion_rate")
    private double turnCompletionRate;

    @Column(name = "avg_response_time")
    private double avgResponseTime; // in seconds

    @Column(name = "grammar_accuracy")
    private double grammarAccuracy; // percentage

    @Column(name = "word_bomb_usage_rate")
    private double wordBombUsageRate; // percentage

    @Column(name = "comprehension_score")
    private double comprehensionScore; // percentage

    @Column(name = "total_score")
    private double totalScore;

    @Column(name = "messages_sent")
    private int messagesSent;

    @Column(name = "words_used")
    private int wordsUsed;

    @Column(name = "perfect_grammar_count")
    private int perfectGrammarCount;

    @OneToMany(mappedBy = "progress", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProgressSnapshot> snapshots = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();

        // Initialize all metrics to 0
        if (totalMessages == 0) {
            totalMessages = 0;
            totalWordsUsed = 0;
            totalPerfectGrammar = 0;
            totalWordBombsUsed = 0;
            turnCompletionRate = 0.0;
            avgResponseTime = 0.0;
            grammarAccuracy = 0.0;
            wordBombUsageRate = 0.0;
            comprehensionScore = 0.0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    // Getters and setters
    // ... (include all fields) .
    // ..
    @Column(name = "total_turns_taken")
    private int totalTurnsTaken;

    @Column(name = "total_response_time")
    private double totalResponseTime; // cumulative response time in seconds

    @Column(name = "total_messages")
    private int totalMessages;

    @Column(name = "total_words_used")
    private int totalWordsUsed;

    @Column(name = "total_perfect_grammar")
    private int totalPerfectGrammar;

    @Column(name = "total_word_bombs_used")
    private int totalWordBombsUsed;

    // ... existing getters and setters ...

    // Add new getters and setters
    public int getTotalTurnsTaken() {
        return totalTurnsTaken;
    }

    public void setTotalTurnsTaken(int totalTurnsTaken) {
        this.totalTurnsTaken = totalTurnsTaken;
    }

    public double getTotalResponseTime() {
        return totalResponseTime;
    }

    public void setTotalResponseTime(double totalResponseTime) {
        this.totalResponseTime = totalResponseTime;
    }

    public int getTotalMessages() {
        return totalMessages;
    }

    public void setTotalMessages(int totalMessages) {
        this.totalMessages = totalMessages;
    }

    public int getTotalWordsUsed() {
        return totalWordsUsed;
    }

    public void setTotalWordsUsed(int totalWordsUsed) {
        this.totalWordsUsed = totalWordsUsed;
    }

    public int getTotalPerfectGrammar() {
        return totalPerfectGrammar;
    }

    public void setTotalPerfectGrammar(int totalPerfectGrammar) {
        this.totalPerfectGrammar = totalPerfectGrammar;
    }

    public int getTotalWordBombsUsed() {
        return totalWordBombsUsed;
    }

    public void setTotalWordBombsUsed(int totalWordBombsUsed) {
        this.totalWordBombsUsed = totalWordBombsUsed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }

    public GameSessionEntity getSession() {
        return session;
    }

    public void setSession(GameSessionEntity session) {
        this.session = session;
    }

    public double getTurnCompletionRate() {
        return turnCompletionRate;
    }

    public void setTurnCompletionRate(double turnCompletionRate) {
        this.turnCompletionRate = turnCompletionRate;
    }

    public double getAvgResponseTime() {
        return avgResponseTime;
    }

    public void setAvgResponseTime(double avgResponseTime) {
        this.avgResponseTime = avgResponseTime;
    }

    public double getGrammarAccuracy() {
        return grammarAccuracy;
    }

    public void setGrammarAccuracy(double grammarAccuracy) {
        this.grammarAccuracy = grammarAccuracy;
    }

    public double getWordBombUsageRate() {
        return wordBombUsageRate;
    }

    public void setWordBombUsageRate(double wordBombUsageRate) {
        this.wordBombUsageRate = wordBombUsageRate;
    }

    public double getComprehensionScore() {
        return comprehensionScore;
    }

    public void setComprehensionScore(double comprehensionScore) {
        this.comprehensionScore = comprehensionScore;
    }

    public double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(double totalScore) {
        this.totalScore = totalScore;
    }

    public int getMessagesSent() {
        return messagesSent;
    }

    public void setMessagesSent(int messagesSent) {
        this.messagesSent = messagesSent;
    }

    public int getWordsUsed() {
        return wordsUsed;
    }

    public void setWordsUsed(int wordsUsed) {
        this.wordsUsed = wordsUsed;
    }

    public int getPerfectGrammarCount() {
        return perfectGrammarCount;
    }

    public void setPerfectGrammarCount(int perfectGrammarCount) {
        this.perfectGrammarCount = perfectGrammarCount;
    }

    public List<ProgressSnapshot> getSnapshots() {
        return snapshots;
    }

    public void setSnapshots(List<ProgressSnapshot> snapshots) {
        this.snapshots = snapshots;
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
}
