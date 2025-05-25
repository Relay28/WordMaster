package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.GrammarResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarResultRepository extends JpaRepository<GrammarResultEntity, Long> {
    List<GrammarResultEntity> findByGameSessionId(Long gameSessionId);
    List<GrammarResultEntity> findByStudentId(Long studentId);
    Optional<GrammarResultEntity> findByGameSessionIdAndStudentId(Long gameSessionId, Long studentId);
    void deleteByGameSessionId(Long sessionId);
}