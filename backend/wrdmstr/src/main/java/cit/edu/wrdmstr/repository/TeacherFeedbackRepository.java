package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.TeacherFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherFeedbackRepository extends JpaRepository<TeacherFeedbackEntity, Long> {
    List<TeacherFeedbackEntity> findByGameSessionId(Long gameSessionId);
    List<TeacherFeedbackEntity> findByStudentId(Long studentId);
    List<TeacherFeedbackEntity> findByTeacherId(Long teacherId);
    Optional<TeacherFeedbackEntity> findByGameSessionIdAndStudentId(Long gameSessionId, Long studentId);
    List<TeacherFeedbackEntity> findByGameSessionIdAndTeacherId(Long gameSessionId, Long teacherId);
    List<TeacherFeedbackEntity> findByGameSessionIdInAndStudentId(List<Long> sessionIds, Long studentId);
    void deleteByGameSessionId(Long sessionId);
}