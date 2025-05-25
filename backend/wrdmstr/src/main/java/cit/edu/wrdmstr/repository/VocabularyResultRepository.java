package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.VocabularyResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyResultRepository extends JpaRepository<VocabularyResultEntity, Long> {
    List<VocabularyResultEntity> findByGameSessionId(Long gameSessionId);
    List<VocabularyResultEntity> findByStudentId(Long studentId);
    Optional<VocabularyResultEntity> findByGameSessionIdAndStudentId(Long gameSessionId, Long studentId);
    void deleteByGameSessionId(Long sessionId);
}