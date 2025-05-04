package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerSessionEntityRepository extends JpaRepository<PlayerSessionEntity, Long> {
    Optional<PlayerSessionEntity> findBySessionAndUser(GameSessionEntity session, UserEntity user);
    List<PlayerSessionEntity> findBySessionId(Long sessionId);
    List<PlayerSessionEntity> findBySessionIdAndUserId(Long sessionId, Long userId);
    List<PlayerSessionEntity> findByUserId(Long userId);


    @Query("SELECT ps FROM PlayerSessionEntity ps WHERE ps.session.id = :sessionId AND ps.role IS NOT NULL")
    List<PlayerSessionEntity> findPlayersWithRolesBySessionId(@Param("sessionId") Long sessionId);

    @Query("SELECT ps FROM PlayerSessionEntity ps WHERE ps.session.id = :sessionId AND ps.wordBombUsed = false")
    List<PlayerSessionEntity> findPlayersWithActiveWordBombs(@Param("sessionId") Long sessionId);

    List<PlayerSessionEntity> findBySessionIdOrderByTotalScoreDesc(Long sessionId);
}
