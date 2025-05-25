package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ComprehensionResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComprehensionResultRepository extends JpaRepository<ComprehensionResultEntity, Long> {
    List<ComprehensionResultEntity> findByGameSessionId(Long gameSessionId);
    List<ComprehensionResultEntity> findByStudentId(Long studentId);
    Optional<ComprehensionResultEntity> findByGameSessionIdAndStudentId(Long gameSessionId, Long studentId);
    void deleteByGameSessionId(Long sessionId);
}