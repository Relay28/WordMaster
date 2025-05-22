package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.TeacherFeedbackDTO;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.service.TeacherFeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import cit.edu.wrdmstr.dto.StudentFeedbackSummaryDTO;
import cit.edu.wrdmstr.entity.Role;
import cit.edu.wrdmstr.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher-feedback")
public class TeacherFeedbackController {

    @Autowired
    private TeacherFeedbackService feedbackService;

    @Autowired
    private UserService userService;

    /**
     * Save teacher feedback for a student
     */
    @PostMapping("/save")
    public ResponseEntity<TeacherFeedbackDTO> saveFeedback(
            @RequestBody TeacherFeedbackDTO feedbackDTO,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.saveFeedback(feedbackDTO, auth));
    }

    /**
     * Get all feedback for a game session (teacher only)
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<TeacherFeedbackDTO>> getFeedbackForSession(
            @PathVariable Long sessionId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.getFeedbackForSession(sessionId, auth));
    }

    /**
     * Get feedback for a specific student in a game session
     */
    @GetMapping("/session/{sessionId}/student/{studentId}")
    public ResponseEntity<TeacherFeedbackDTO> getStudentFeedback(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.getStudentFeedback(sessionId, studentId, auth));
    }

    /**
     * Generate AI-suggested feedback for a student
     */
    @GetMapping("/generate/{sessionId}/student/{studentId}")
    public ResponseEntity<TeacherFeedbackDTO> generateAISuggestedFeedback(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.generateAISuggestedFeedback(sessionId, studentId));
    }

    /**
     * Get performance summary for all students in a session
     */
    @GetMapping("/summary/{sessionId}")
    public ResponseEntity<List<Map<String, Object>>> getSessionPerformanceSummary(
            @PathVariable Long sessionId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.getSessionPerformanceSummary(sessionId, auth));
    }

    /**
     * Generate comprehension questions for a student
     */
    @GetMapping("/comprehension/{sessionId}/student/{studentId}/questions")
    public ResponseEntity<List<Map<String, Object>>> generateComprehensionQuestions(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.generateComprehensionQuestions(sessionId, studentId, auth));
    }

    /**
     * Submit and grade comprehension answers
     */
    @PostMapping("/comprehension/{sessionId}/student/{studentId}/answers")
    public ResponseEntity<Map<String, Object>> submitComprehensionAnswers(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            @RequestBody Map<String, Object> submission,
            Authentication auth) {

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) submission.get("questions");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answers = (List<Map<String, Object>>) submission.get("answers");

        return ResponseEntity.ok(feedbackService.submitComprehensionAnswers(
                sessionId, studentId, questions, answers, auth));
    }

    @GetMapping("/student-feedback/classroom/{classroomId}/student/{studentId}")
    public ResponseEntity<List<StudentFeedbackSummaryDTO>> getStudentFeedbackInClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long studentId,
            Authentication authentication) {
        
        // Security check - user can only view their own feedback
        String userEmail = authentication.getName();
        UserEntity user = userService.findByEmail(userEmail);
        
        if (!(user.getId() == studentId) && !"USER_TEACHER".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<StudentFeedbackSummaryDTO> feedbacks = feedbackService.getStudentFeedbackInClassroom(classroomId, studentId);
        return ResponseEntity.ok(feedbacks);
    }
    /**
     * Get comprehensive student analytics for teacher review
     */
    @GetMapping("/analytics/{sessionId}/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentAnalytics(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(feedbackService.getStudentAnalytics(sessionId, studentId, auth));
    }
}