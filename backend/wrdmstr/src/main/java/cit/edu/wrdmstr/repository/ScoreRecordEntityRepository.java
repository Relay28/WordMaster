package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ScoreRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScoreRecordEntityRepository extends JpaRepository<ScoreRecordEntity, Long> {
    List<ScoreRecordEntity> findBySessionIdOrderByTimestampAsc(Long sessionId);
    List<ScoreRecordEntity> findBySessionIdAndUserId(Long sessionId, Long userId);

    @Query("SELECT sr.user.id, SUM(sr.points) FROM ScoreRecordEntity sr WHERE sr.session.id = :sessionId GROUP BY sr.user.id")
    List<Object[]> getTotalScoresByUser(@Param("sessionId") Long sessionId);

    @Query("SELECT sr.reason, SUM(sr.points) FROM ScoreRecordEntity sr WHERE sr.session.id = :sessionId AND sr.user.id = :userId GROUP BY sr.reason")
    List<Object[]> getScoreBreakdown(@Param("sessionId") Long sessionId,
                                     @Param("userId") Long userId);

    List<ScoreRecordEntity> findBySessionId(Long sessionId);
}