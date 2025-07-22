package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.PlayerCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlayerCardRepository extends JpaRepository<PlayerCard, Long> {
    // Custom query methods can be added here if needed
    // For example, to find all cards for a specific player session:
    // List<PlayerCard> findByPlayerSession(PlayerSessionEntity playerSession);

    @Query("SELECT pc FROM PlayerCard pc WHERE pc.playerSession.id = :playerSessionId")
    List<PlayerCard> findByPlayerSessionId(@Param("playerSessionId") Long playerSessionId);

    @Query("SELECT pc FROM PlayerCard pc WHERE pc.playerSession.id = :playerSessionId AND pc.used = false AND pc.activated = true")
    List<PlayerCard> findActiveCardsByPlayerSessionId(@Param("playerSessionId") Long playerSessionId);

    // Alternative implementation using Spring Data JPA naming convention (works without @Query)
    // List<PlayerCard> findByPlayerSession_Id(Long playerSessionId);

    @Modifying
    @Query("UPDATE PlayerCard pc SET pc.used = true WHERE pc.id = :cardId")
    void markCardAsUsed(@Param("cardId") Long cardId);

    @Modifying
    @Query("UPDATE PlayerCard pc SET pc.activated = false WHERE pc.id = :cardId")
    void deactivateCard(@Param("cardId") Long cardId);
}
