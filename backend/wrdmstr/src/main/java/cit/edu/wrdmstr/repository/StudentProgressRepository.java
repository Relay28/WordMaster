package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, Long> {

    List<StudentProgress> findBySessionId(Long sessionId);
    Optional<StudentProgress> findByStudentIdAndSessionId(Long studentId, Long sessionId);


    List<StudentProgress> findByStudentId(Long studentId);
}
