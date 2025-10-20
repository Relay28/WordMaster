package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "chat_messages")
public class ChatMessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private MessageStatus grammarStatus;

    @Lob
    @Column(name = "grammar_feedback", columnDefinition = "TEXT")
    private String grammarFeedback;

    @Column(name = "contains_word_bomb")
    private boolean containsWordBomb = false;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date timestamp;

    @Lob
    @Column(name = "word_used", columnDefinition = "TEXT")
    private String wordUsed;

    @Lob
    @Column(name = "word_variations", columnDefinition = "TEXT")
    private String wordVariations; // Actual text variations found (e.g., "saw, ate, photos")

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_session_id")
    private PlayerSessionEntity playerSession;  // Additional connection to player sessio

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReactionEntity> reactions = new ArrayList<>();

    @Column(name = "vocabulary_score")
    private Integer vocabularyScore;

    @Lob
    @Column(name = "vocabulary_feedback", columnDefinition = "TEXT")
    private String vocabularyFeedback;

    // Getters and setters


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

    public UserEntity getSender() {
        return sender;
    }
    @Column(name = "role_appropriate")
    private boolean roleAppropriate;

    // Getter and Setter
    public boolean isRoleAppropriate() {
        return roleAppropriate;
    }

    public void setRoleAppropriate(boolean roleAppropriate) {
        this.roleAppropriate = roleAppropriate;
    }
    public void setSender(UserEntity sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageStatus getGrammarStatus() {
        return grammarStatus;
    }

    public void setGrammarStatus(MessageStatus grammarStatus) {
        this.grammarStatus = grammarStatus;
    }

    public String getGrammarFeedback() {
        return grammarFeedback;
    }

    public void setGrammarFeedback(String grammarFeedback) {
        this.grammarFeedback = grammarFeedback;
    }

    public boolean isContainsWordBomb() {
        return containsWordBomb;
    }

    public void setContainsWordBomb(boolean containsWordBomb) {
        this.containsWordBomb = containsWordBomb;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public PlayerSessionEntity getPlayerSession() {
        return playerSession;
    }

    public void setPlayerSession(PlayerSessionEntity playerSession) {
        this.playerSession = playerSession;
    }

    public List<MessageReactionEntity> getReactions() {
        return reactions;
    }

    public void setReactions(List<MessageReactionEntity> reactions) {
        this.reactions = reactions;
    }

    public enum MessageStatus {
        PERFECT, MINOR_ERRORS, MAJOR_ERRORS, PENDING
    }

    public String getWordUsed() {
    return wordUsed;
    }

    public void setWordUsed(String wordUsed) {
        this.wordUsed = wordUsed;
    }

    public String getWordVariations() {
        return wordVariations;
    }

    public void setWordVariations(String wordVariations) {
        this.wordVariations = wordVariations;
    }

    public Integer getVocabularyScore() {
        return vocabularyScore;
    }

    public void setVocabularyScore(Integer vocabularyScore) {
        this.vocabularyScore = vocabularyScore;
    }

    public String getVocabularyFeedback() {
        return vocabularyFeedback;
    }

    public void setVocabularyFeedback(String vocabularyFeedback) {
        this.vocabularyFeedback = vocabularyFeedback;
    }
}