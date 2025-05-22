package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "player_sessions")
public class PlayerSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    // Bidirectional to ChatMessage
    @OneToMany(mappedBy = "playerSession", cascade = CascadeType.ALL)
    private List<ChatMessageEntity> messages = new ArrayList<>();
    private String avatar;
    private boolean isActive = true;

    @Column(name = "current_word_bomb")
    private String currentWordBomb;

    @Column(name = "word_bomb_used")
    private boolean wordBombUsed = false;

    @Column(name = "grammar_streak")
    private int grammarStreak = 0;

    @Column(name = "total_score")
    private int totalScore = 0;
    @Column(name = "group_number")
    private Integer groupNumber;

    private boolean isCardsDrawn =  false;
    private String profilePicture;
    public boolean isCardsDrawn() {
        return isCardsDrawn;
    }
    public void setCardsDrawn(boolean cardsDrawn) {
        isCardsDrawn = cardsDrawn;
    }

    public Integer getGroupNumber() {
        return groupNumber;
    }

    public void setGroupNumber(Integer groupNumber) {
        this.groupNumber = groupNumber;
    }
    // Getters and setters


    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GameSessionEntity getSession() {
        return session;
    }

    public void setSession(GameSessionEntity session) {
        this.session = session;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public List<ChatMessageEntity> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessageEntity> messages) {
        this.messages = messages;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getCurrentWordBomb() {
        return currentWordBomb;
    }

    public void setCurrentWordBomb(String currentWordBomb) {
        this.currentWordBomb = currentWordBomb;
    }

    public boolean isWordBombUsed() {
        return wordBombUsed;
    }

    public void setWordBombUsed(boolean wordBombUsed) {
        this.wordBombUsed = wordBombUsed;
    }

    public int getGrammarStreak() {
        return grammarStreak;
    }

    public void setGrammarStreak(int grammarStreak) {
        this.grammarStreak = grammarStreak;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }
}