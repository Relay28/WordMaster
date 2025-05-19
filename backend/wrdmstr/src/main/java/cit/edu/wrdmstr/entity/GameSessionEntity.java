package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "game_sessions")
public class GameSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private ContentEntity content;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    @Column(nullable = false)
    private String sessionCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20) // Adjust length as needed
    private SessionStatus status = SessionStatus.PENDING;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "started_at")
    private Date startedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "ended_at")
    private Date endedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "session", cascade = {CascadeType.MERGE, CascadeType.REFRESH})
    private List<PlayerSessionEntity> players = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessageEntity> messages = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScoreRecordEntity> scores = new ArrayList<>();

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ContentEntity getContent() {
        return content;
    }

    public void addPlayer(PlayerSessionEntity player) {
        if (!players.contains(player)) {
            players.add(player);
            player.setSession(this); // maintain bidirectional consistency
        }
    }

    public void removePlayer(PlayerSessionEntity player) {
        if (players.remove(player)) {
            player.setSession(null); // break the association
        }
    }


    public void setContent(ContentEntity content) {
        this.content = content;
    }

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public Date getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Date startedAt) {
        this.startedAt = startedAt;
    }

    public Date getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Date endedAt) {
        this.endedAt = endedAt;
    }

    public List<PlayerSessionEntity> getPlayers() {
        return players;
    }

    public void setPlayers(List<PlayerSessionEntity> players) {
        this.players = players;
    }

    public List<ChatMessageEntity> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessageEntity> messages) {
        this.messages = messages;
    }

    public List<ScoreRecordEntity> getScores() {
        return scores;
    }

    public void setScores(List<ScoreRecordEntity> scores) {
        this.scores = scores;
    }

    public enum SessionStatus {
        PENDING,
        WAITING,
        ACTIVE,
        COMPLETED
    }
}