package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameSessionEntityRepository extends JpaRepository<GameSessionEntity, Long> {
    Optional<GameSessionEntity> findBySessionCode(String sessionCode);
    List<GameSessionEntity> findByContentId(Long contentId);
    List<GameSessionEntity> findByTeacherId(Long teacherId);
    List<GameSessionEntity> findByStatus(GameSessionEntity.SessionStatus status);
    @Query("SELECT g FROM GameSessionEntity g WHERE g.teacher.id = :teacherId AND g.content.id = :contentId AND g.status = 'STARTED'")
    List<GameSessionEntity> findByTeacherAndContent(@Param("teacherId") Long teacherId, @Param("contentId") Long contentId);
    List<GameSessionEntity> findByContentIdIn(List<Long> contentIds);
    @Query("SELECT gs FROM GameSessionEntity gs JOIN gs.players p WHERE p.user.id = :userId")
    List<GameSessionEntity> findSessionsByPlayerId(@Param("userId") Long userId);
    @Query("SELECT g FROM GameSessionEntity g WHERE g.content.id = :contentId AND g.status = 'ACTIVE'")
    List<GameSessionEntity> findActiveSessionsByContent(@Param("contentId") Long contentId);
}
