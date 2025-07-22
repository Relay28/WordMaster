package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "player_cards")
public class PlayerCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_session_id", nullable = false)
    private PlayerSessionEntity playerSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private PowerupCard card;

    @Column(nullable = false)
    private boolean used = false;
    
    @Column(nullable = false)
    private boolean activated = true;  // Add the missing field with default value

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PlayerSessionEntity getPlayerSession() {
        return playerSession;
    }

    public void setPlayerSession(PlayerSessionEntity playerSession) {
        this.playerSession = playerSession;
    }

    public PowerupCard getCard() {
        return card;
    }

    public void setCard(PowerupCard card) {
        this.card = card;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
    
    public boolean isActivated() {
        return activated;
    }
    
    public void setActivated(boolean activated) {
        this.activated = activated;
    }
}