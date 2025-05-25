package cit.edu.wrdmstr.service.interfaces;

import cit.edu.wrdmstr.dto.StudentFeedbackSummaryDTO;
import cit.edu.wrdmstr.dto.TeacherFeedbackDTO;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

public interface ITeacherFeedbackService {
    TeacherFeedbackDTO saveFeedback(TeacherFeedbackDTO feedbackDTO, Authentication auth);
    TeacherFeedbackDTO getStudentFeedback(Long sessionId, Long studentId, Authentication auth);
    List<Map<String, Object>> getSessionPerformanceSummary(Long sessionId, Authentication auth);
    List<Map<String, Object>> generateComprehensionQuestions(Long sessionId, Long studentId, Authentication auth);
    Map<String, Object> submitComprehensionAnswers(Long sessionId, Long studentId, List<Map<String, Object>> questions, List<Map<String, Object>> answers, Authentication auth);
    Map<String, Object> getStudentAnalytics(Long sessionId, Long studentId, Authentication auth);
    List<StudentFeedbackSummaryDTO> getStudentFeedbackInClassroom(Long classroomId, Long studentId);
    TeacherFeedbackDTO createFeedbackFromComprehensionResults(Long sessionId, Long studentId, Authentication auth);
    Map<String, Object> getStudentAnalytics(Long sessionId, Long studentId);
}