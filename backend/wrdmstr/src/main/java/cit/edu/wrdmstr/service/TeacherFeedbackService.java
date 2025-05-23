package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.TeacherFeedbackDTO;
import cit.edu.wrdmstr.dto.StudentFeedbackSummaryDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.gameplay.ScoreService;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeacherFeedbackService {
    private static final Logger logger = LoggerFactory.getLogger(TeacherFeedbackService.class);

    @Autowired private TeacherFeedbackRepository feedbackRepository;
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private ScoreRecordEntityRepository scoreRepository;
    @Autowired private AIService aiService;
    @Autowired private ComprehensionCheckService comprehensionCheckService;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ScoreService scoreService;
    @Autowired private ClassroomRepository classroomRepository;
    @Autowired private ComprehensionResultRepository comprehensionResultRepository;

    /**
     * Create or update feedback for a student in a game session
     */
    public TeacherFeedbackDTO saveFeedback(TeacherFeedbackDTO feedbackDTO, Authentication auth) {
        UserEntity teacher = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        GameSessionEntity gameSession = gameSessionRepository.findById(feedbackDTO.getGameSessionId())
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        UserEntity student = userRepository.findById(feedbackDTO.getStudentId())
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Check if teacher is authorized to provide feedback for this session
        if (!Objects.equals(gameSession.getTeacher().getId(), teacher.getId())) {
            throw new RuntimeException("You are not authorized to provide feedback for this session");
        }
        
        // Find existing feedback or create new
        TeacherFeedbackEntity feedback = feedbackRepository
            .findByGameSessionIdAndStudentId(gameSession.getId(), student.getId())
            .orElse(new TeacherFeedbackEntity());
        
        // Update feedback entity
        feedback.setGameSession(gameSession);
        feedback.setStudent(student);
        feedback.setTeacher(teacher);
        feedback.setFeedback(feedbackDTO.getFeedback());
        feedback.setComprehensionScore(feedbackDTO.getComprehensionScore());
        feedback.setParticipationScore(feedbackDTO.getParticipationScore());
        feedback.setLanguageUseScore(feedbackDTO.getLanguageUseScore());
        feedback.setRoleAdherenceScore(feedbackDTO.getRoleAdherenceScore());
        feedback.setOverallGrade(feedbackDTO.getOverallGrade());
        
        // Save and return
        TeacherFeedbackEntity savedFeedback = feedbackRepository.save(feedback);
        return convertToDTO(savedFeedback, true);
    }

    /**
     * Get all feedback for a game session (teacher only)
     */
    public List<TeacherFeedbackDTO> getFeedbackForSession(Long sessionId, Authentication auth) {
        UserEntity teacher = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        GameSessionEntity gameSession = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        // Check if teacher is authorized to view feedback for this session
        if (!Objects.equals(gameSession.getTeacher().getId(), teacher.getId())) {
            throw new RuntimeException("You are not authorized to view feedback for this session");
        }
        
        List<TeacherFeedbackEntity> feedback = feedbackRepository.findByGameSessionId(sessionId);
        return feedback.stream()
            .map(fb -> convertToDTO(fb, true))
            .collect(Collectors.toList());
    }

    /**
     * Get feedback for a specific student in a game session
     */
    public TeacherFeedbackDTO getStudentFeedback(Long sessionId, Long studentId, Authentication auth) {
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        GameSessionEntity gameSession = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        // Check if user is authorized (either the teacher or the student)
        boolean isTeacher = Objects.equals(gameSession.getTeacher().getId(), user.getId());
        boolean isStudent = Objects.equals(studentId, user.getId());
        
        if (!isTeacher && !isStudent) {
            throw new RuntimeException("You are not authorized to view this feedback");
        }
        
        TeacherFeedbackEntity feedback = feedbackRepository
            .findByGameSessionIdAndStudentId(sessionId, studentId)
            .orElse(null);
        
        if (feedback != null) {
            return convertToDTO(feedback, isTeacher);
        } else if (isTeacher) {
            // For teachers, generate a new feedback with AI suggestions if none exists
            return generateAISuggestedFeedback(sessionId, studentId);
        } else {
            return new TeacherFeedbackDTO(); // Empty DTO for student if no feedback exists
        }
    }

    /**
     * Generate AI-suggested feedback for a student
     */
    public TeacherFeedbackDTO generateAISuggestedFeedback(Long sessionId, Long studentId) {
        GameSessionEntity gameSession = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Get player session
        List<PlayerSessionEntity> playerSessions = playerSessionRepository
            .findBySessionIdAndUserId(sessionId, studentId);
        
        if (playerSessions.isEmpty()) {
            throw new RuntimeException("Player not found in this session");
        }
        
        PlayerSessionEntity playerSession = playerSessions.get(0);
        
        // Get player messages
        List<ChatMessageEntity> messages = chatMessageRepository
            .findBySessionIdAndSenderIdOrderByTimestampAsc(sessionId, studentId);
        
        // Get player scores
        List<ScoreRecordEntity> scores = scoreRepository
            .findBySessionIdAndUserId(sessionId, studentId);
        
        // Calculate stats
        int totalScore = playerSession.getTotalScore();
        int messageCount = messages.size();
        int perfectGrammarCount = (int) messages.stream()
            .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
            .count();
        
        // Count word bank usage
        int wordBankUsageCount = (int) scores.stream()
            .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
            .count();
        
        // Prepare AI request
        Map<String, Object> request = new HashMap<>();
        request.put("task", "generate_feedback");
        request.put("studentName", student.getFname() + " " + student.getLname()); // Add this line
        request.put("role", playerSession.getRole() != null ? playerSession.getRole().getName() : "Unknown");
        request.put("totalScore", totalScore);
        request.put("messageCount", messageCount);
        request.put("perfectGrammarCount", perfectGrammarCount);
        request.put("wordBankUsageCount", wordBankUsageCount);
        
        // Add sample messages (limit to 5 for brevity)
        List<String> sampleMessages = messages.stream()
            .map(ChatMessageEntity::getContent)
            .limit(5)
            .collect(Collectors.toList());
        request.put("sampleMessages", sampleMessages);
        
        // Call AI service
        String aiSuggestion = aiService.callAIModel(request).getResult();
        
        // Extract scores
        Map<String, Object> extractedScores = extractScoresFromAIFeedback(aiSuggestion);
        
        // Create feedback DTO and set scores
        TeacherFeedbackDTO feedbackDTO = new TeacherFeedbackDTO();
        feedbackDTO.setGameSessionId(sessionId);
        feedbackDTO.setStudentId(studentId);
        feedbackDTO.setStudentName(student.getFname() + " " + student.getLname());
        feedbackDTO.setAiSuggestedFeedback(aiSuggestion);
        feedbackDTO.setTotalScore(totalScore);
        feedbackDTO.setMessageCount(messageCount);
        feedbackDTO.setWordBankUsageCount(wordBankUsageCount);
        feedbackDTO.setPerfectGrammarCount(perfectGrammarCount);
        feedbackDTO.setComprehensionScore((Integer) extractedScores.getOrDefault("comprehensionScore", 3));
        feedbackDTO.setParticipationScore((Integer) extractedScores.getOrDefault("participationScore", 3));
        feedbackDTO.setLanguageUseScore((Integer) extractedScores.getOrDefault("languageUseScore", 3));
        feedbackDTO.setRoleAdherenceScore((Integer) extractedScores.getOrDefault("roleAdherenceScore", 3));
        feedbackDTO.setOverallGrade((String) extractedScores.getOrDefault("overallGrade", "B"));
        
        return feedbackDTO;
    }

    // Add this helper method
    private Map<String, Object> extractScoresFromAIFeedback(String aiSuggestion) {
        Map<String, Object> scores = new HashMap<>();
        
        // Extract comprehension score
        Pattern comprPattern = Pattern.compile("Comprehension Score:\\s*([1-5])", Pattern.CASE_INSENSITIVE);
        Matcher comprMatcher = comprPattern.matcher(aiSuggestion);
        if (comprMatcher.find()) {
            scores.put("comprehensionScore", Integer.parseInt(comprMatcher.group(1)));
        }
        
        // Extract participation score
        Pattern partPattern = Pattern.compile("Participation Score:\\s*([1-5])", Pattern.CASE_INSENSITIVE);
        Matcher partMatcher = partPattern.matcher(aiSuggestion);
        if (partMatcher.find()) {
            scores.put("participationScore", Integer.parseInt(partMatcher.group(1)));
        }
        
        // Extract language use score
        Pattern langPattern = Pattern.compile("Language Use Score:\\s*([1-5])", Pattern.CASE_INSENSITIVE);
        Matcher langMatcher = langPattern.matcher(aiSuggestion);
        if (langMatcher.find()) {
            scores.put("languageUseScore", Integer.parseInt(langMatcher.group(1)));
        }
        
        // Extract role adherence score
        Pattern rolePattern = Pattern.compile("Role Adherence Score:\\s*([1-5])", Pattern.CASE_INSENSITIVE);
        Matcher roleMatcher = rolePattern.matcher(aiSuggestion);
        if (roleMatcher.find()) {
            scores.put("roleAdherenceScore", Integer.parseInt(roleMatcher.group(1)));
        }
        
        // Extract overall grade
        Pattern gradePattern = Pattern.compile("Overall Letter Grade:\\s*([A-F][+-]?)", Pattern.CASE_INSENSITIVE);
        Matcher gradeMatcher = gradePattern.matcher(aiSuggestion);
        if (gradeMatcher.find()) {
            scores.put("overallGrade", gradeMatcher.group(1).toUpperCase());
        }
        
        return scores;
    }
    /**
     * Get student performance summary for a game session
     */
    public List<Map<String, Object>> getSessionPerformanceSummary(Long sessionId, Authentication auth) {
        UserEntity teacher = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        GameSessionEntity gameSession = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        // Check if teacher is authorized
        if (!Objects.equals(gameSession.getTeacher().getId(), teacher.getId())) {
            throw new RuntimeException("You are not authorized to view this session");
        }
        
        // Get all players in this session
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (PlayerSessionEntity player : players) {
            Map<String, Object> playerSummary = new HashMap<>();
            UserEntity user = player.getUser();
            
            // Basic info
            playerSummary.put("userId", user.getId());
            playerSummary.put("name", user.getFname() + " " + user.getLname());
            playerSummary.put("email", user.getEmail());
            playerSummary.put("role", player.getRole() != null ? player.getRole().getName() : "None");
            playerSummary.put("totalScore", player.getTotalScore());
            
            // Count messages
            List<ChatMessageEntity> messages = chatMessageRepository
                .findBySessionIdAndSenderId(sessionId, user.getId());
            playerSummary.put("messageCount", messages.size());
            
            // Grammar statistics
            Map<String, Long> grammarStats = messages.stream()
                .collect(Collectors.groupingBy(
                    msg -> msg.getGrammarStatus().toString(),
                    Collectors.counting()
                ));
            playerSummary.put("grammarStats", grammarStats);
            
            // Score breakdown by reason
            List<Map<String, Object>> scoreBreakdown = scoreService.getPlayerScoreBreakdown(sessionId, user.getId());
            playerSummary.put("scoreBreakdown", scoreBreakdown);
            
            // Check if feedback exists
            Optional<TeacherFeedbackEntity> feedback = feedbackRepository
                .findByGameSessionIdAndStudentId(sessionId, user.getId());
            playerSummary.put("hasFeedback", feedback.isPresent());
            if (feedback.isPresent()) {
                playerSummary.put("overallGrade", feedback.get().getOverallGrade());
            }
            
            result.add(playerSummary);
        }
        
        return result;
    }

    /**
     * Convert entity to DTO
     */
    private TeacherFeedbackDTO convertToDTO(TeacherFeedbackEntity entity, boolean includeAiSuggestions) {
        TeacherFeedbackDTO dto = new TeacherFeedbackDTO();
        dto.setId(entity.getId());
        dto.setGameSessionId(entity.getGameSession().getId());
        dto.setStudentId(entity.getStudent().getId());
        dto.setStudentName(entity.getStudent().getFname() + " " + entity.getStudent().getLname());
        dto.setTeacherId(entity.getTeacher().getId());
        dto.setTeacherName(entity.getTeacher().getFname() + " " + entity.getTeacher().getLname());
        dto.setFeedback(entity.getFeedback());
        dto.setComprehensionScore(entity.getComprehensionScore());
        dto.setParticipationScore(entity.getParticipationScore());
        dto.setLanguageUseScore(entity.getLanguageUseScore());
        dto.setRoleAdherenceScore(entity.getRoleAdherenceScore());
        dto.setOverallGrade(entity.getOverallGrade());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        
        // Only include AI suggestions for teachers
        if (includeAiSuggestions) {
            dto.setAiSuggestedFeedback(entity.getAiSuggestedFeedback());
        }
        
        // Get performance stats
        List<PlayerSessionEntity> playerSessions = playerSessionRepository
            .findBySessionIdAndUserId(entity.getGameSession().getId(), entity.getStudent().getId());
        
        if (!playerSessions.isEmpty()) {
            PlayerSessionEntity player = playerSessions.get(0);
            dto.setTotalScore(player.getTotalScore());
            
            // Count messages
            List<ChatMessageEntity> messages = chatMessageRepository
                .findBySessionIdAndSenderId(entity.getGameSession().getId(), entity.getStudent().getId());
            dto.setMessageCount(messages.size());
            
            // Count perfect grammar
            long perfectGrammarCount = messages.stream()
                .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
                .count();
            dto.setPerfectGrammarCount((int) perfectGrammarCount);
            
            // Count word bank usage
            long wordBankUsageCount = scoreRepository.findBySessionIdAndUserId(
                    entity.getGameSession().getId(), entity.getStudent().getId()).stream()
                .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
                .count();
            dto.setWordBankUsageCount((int) wordBankUsageCount);
        }
        
        return dto;
    }

    /**
     * Generate comprehension questions for a student
     */
    public List<Map<String, Object>> generateComprehensionQuestions(Long sessionId, Long studentId, Authentication auth) {
        // Verify authority
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        // Check if user is authorized (either the teacher or the student)
        boolean isTeacher = Objects.equals(session.getTeacher().getId(), user.getId());
        boolean isStudent = Objects.equals(studentId, user.getId());
        
        if (!isTeacher && !isStudent) {
            throw new RuntimeException("You are not authorized to access comprehension questions");
        }
        
        return comprehensionCheckService.generateComprehensionQuestions(sessionId, studentId);
    }

    /**
     * Submit and grade comprehension answers
     */
    public Map<String, Object> submitComprehensionAnswers(
            Long sessionId, 
            Long studentId, 
            List<Map<String, Object>> questions,
            List<Map<String, Object>> answers,
            Authentication auth) {
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Grade the answers
        Map<String, Object> gradeResult = comprehensionCheckService.gradeComprehensionAnswers(questions, answers);
        double percentage = (Double) gradeResult.get("percentage");
        
        try {
            // Find or create comprehension result
            ComprehensionResultEntity result = comprehensionResultRepository
                .findByGameSessionIdAndStudentId(sessionId, studentId)
                .orElse(new ComprehensionResultEntity());
            
            // Set the data
            result.setGameSession(session);
            result.setStudent(student);
            result.setComprehensionQuestions(objectMapper.writeValueAsString(questions));
            result.setComprehensionAnswers(objectMapper.writeValueAsString(answers));
            result.setComprehensionPercentage(percentage);
            
            // Save comprehension result (without creating/updating teacher feedback)
            comprehensionResultRepository.save(result);
            
            // Return the grade result
            return gradeResult;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error saving comprehension answers", e);
        }
    }

    /**
     * Get comprehensive student analytics for teacher review
     */
    public Map<String, Object> getStudentAnalytics(Long sessionId, Long studentId, Authentication auth) {
        // Verify authority
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        // Allow access if the user is either the teacher or the student viewing their own feedback
        boolean isTeacher = Objects.equals(session.getTeacher().getId(), user.getId());
        boolean isOwnFeedback = Objects.equals(user.getId(), studentId);

        if (!isTeacher && !isOwnFeedback) {
            throw new RuntimeException("You can only view your own feedback or feedback for students in your sessions");
        }
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Basic player info
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        analytics.put("studentId", student.getId());
        analytics.put("studentName", student.getFname() + " " + student.getLname());
        analytics.put("studentEmail", student.getEmail());
        
        // Get player session
        List<PlayerSessionEntity> playerSessions = playerSessionRepository
            .findBySessionIdAndUserId(sessionId, studentId);
        
        if (playerSessions.isEmpty()) {
            throw new RuntimeException("Player not found in this session");
        }
        
        PlayerSessionEntity playerSession = playerSessions.get(0);
        analytics.put("role", playerSession.getRole() != null ? playerSession.getRole().getName() : "None");
        analytics.put("totalScore", playerSession.getTotalScore());
        analytics.put("grammarStreak", playerSession.getGrammarStreak());
        
        // Messages analysis
        List<ChatMessageEntity> messages = chatMessageRepository
            .findBySessionIdAndSenderIdOrderByTimestampAsc(sessionId, studentId);
        
        analytics.put("messageCount", messages.size());
        
        // Grammar breakdown
        Map<String, Long> grammarBreakdown = messages.stream()
            .collect(Collectors.groupingBy(
                m -> m.getGrammarStatus().toString(),
                Collectors.counting()
            ));
        analytics.put("grammarBreakdown", grammarBreakdown);
        
        // Word usage analysis
        List<ScoreRecordEntity> wordUsageScores = scoreRepository
            .findBySessionIdAndUserId(sessionId, studentId).stream()
            .filter(s -> s.getReason() != null && s.getReason().contains("word bank"))
            .collect(Collectors.toList());
        
        analytics.put("wordBankUsageCount", wordUsageScores.size());
        
        // Message content analysis (sample of messages)
        List<Map<String, Object>> messageAnalysis = messages.stream()
            .limit(10) // Limit to 10 most recent messages for brevity
            .map(m -> {
                Map<String, Object> analysis = new HashMap<>();
                analysis.put("timestamp", m.getTimestamp());
                analysis.put("content", m.getContent());
                analysis.put("grammarStatus", m.getGrammarStatus());
                analysis.put("wordUsed", m.getWordUsed());
                return analysis;
            })
            .collect(Collectors.toList());
        
        analytics.put("messageAnalysis", messageAnalysis);
        
        // Score breakdown
        List<Map<String, Object>> scoreBreakdown = scoreService.getPlayerScoreBreakdown(sessionId, studentId);
        analytics.put("scoreBreakdown", scoreBreakdown);
        
        // Get existing feedback
        TeacherFeedbackEntity feedback = feedbackRepository
            .findByGameSessionIdAndStudentId(sessionId, studentId)
            .orElse(null);
        
        if (feedback != null) {
            Map<String, Object> feedbackData = new HashMap<>();
            feedbackData.put("id", feedback.getId());
            feedbackData.put("feedback", feedback.getFeedback());
            feedbackData.put("comprehensionScore", feedback.getComprehensionScore());
            feedbackData.put("participationScore", feedback.getParticipationScore());
            feedbackData.put("languageUseScore", feedback.getLanguageUseScore());
            feedbackData.put("roleAdherenceScore", feedback.getRoleAdherenceScore());
            feedbackData.put("overallGrade", feedback.getOverallGrade());
            feedbackData.put("aiSuggestedFeedback", feedback.getAiSuggestedFeedback());
            
            // Parse comprehension data
            if (feedback.getComprehensionQuestions() != null) {
                try {
                    List<Map<String, Object>> questions = objectMapper.readValue(
                        feedback.getComprehensionQuestions(),
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                    feedbackData.put("comprehensionQuestions", questions);
                } catch (JsonProcessingException e) {
                    logger.error("Error parsing comprehension questions: " + e.getMessage(), e);
                }
            }
            
            if (feedback.getComprehensionAnswers() != null) {
                try {
                    List<Map<String, Object>> answers = objectMapper.readValue(
                        feedback.getComprehensionAnswers(),
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                    feedbackData.put("comprehensionAnswers", answers);
                } catch (JsonProcessingException e) {
                    logger.error("Error parsing comprehension answers: " + e.getMessage(), e);
                }
            }
            
            feedbackData.put("comprehensionPercentage", feedback.getComprehensionPercentage());
            
            analytics.put("feedback", feedbackData);
        }
        
        // Add teacher info
        analytics.put("teacherName", session.getTeacher().getFname() + " " + session.getTeacher().getLname());
        
        // Add session date info
        analytics.put("sessionDate", session.getStartedAt());
        analytics.put("contentTitle", session.getContent().getTitle());
        
        return analytics;
    }

    /**
     * Get all feedback for a student in a specific classroom
     */
    public List<StudentFeedbackSummaryDTO> getStudentFeedbackInClassroom(Long classroomId, Long studentId) {
        // Get the classroom from repository
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
            .orElseThrow(() -> new RuntimeException("Classroom not found"));
        
        // Get content IDs from this classroom
        List<Long> contentIds = classroom.getContents().stream()
            .map(ContentEntity::getId)
            .collect(Collectors.toList());
        
        if (contentIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Get all game sessions from these contents
        List<GameSessionEntity> sessions = gameSessionRepository.findByContentIdIn(contentIds);
        
        if (sessions.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Get session IDs
        List<Long> sessionIds = sessions.stream()
            .map(GameSessionEntity::getId)
            .collect(Collectors.toList());
        
        // Get feedback for these sessions and this student
        List<TeacherFeedbackEntity> feedbacks = feedbackRepository.findByGameSessionIdInAndStudentId(sessionIds, studentId);
        
        // Convert to DTOs
        return feedbacks.stream().map(feedback -> {
            StudentFeedbackSummaryDTO dto = new StudentFeedbackSummaryDTO();
            dto.setId(feedback.getId());
            dto.setSessionId(feedback.getGameSession().getId());
            dto.setStudentId(feedback.getStudent().getId());
            dto.setTeacherId(feedback.getTeacher().getId());
            dto.setTeacherName(feedback.getTeacher().getFname() + " " + feedback.getTeacher().getLname());
            dto.setGameTitle(feedback.getGameSession().getContent().getTitle());
            dto.setFeedback(feedback.getFeedback());
            dto.setComprehensionScore(feedback.getComprehensionScore());
            dto.setParticipationScore(feedback.getParticipationScore());
            dto.setLanguageUseScore(feedback.getLanguageUseScore());
            dto.setRoleAdherenceScore(feedback.getRoleAdherenceScore());
            dto.setOverallGrade(feedback.getOverallGrade());
            dto.setCreatedAt(feedback.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
    }
    
    /**
     * Create teacher feedback based on comprehension results
     */
    public TeacherFeedbackDTO createFeedbackFromComprehensionResults(
            Long sessionId, Long studentId, Authentication auth) {
        
        // Verify teacher access
        UserEntity teacher = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        if (!Objects.equals(session.getTeacher().getId(), teacher.getId())) {
            throw new RuntimeException("Only the session teacher can create feedback");
        }
        
        // Get the student
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Get comprehension results
        ComprehensionResultEntity result = comprehensionResultRepository
            .findByGameSessionIdAndStudentId(sessionId, studentId)
            .orElseThrow(() -> new RuntimeException("No comprehension results found"));
        
        // Create or update feedback entity
        TeacherFeedbackEntity feedback = feedbackRepository
            .findByGameSessionIdAndStudentId(sessionId, studentId)
            .orElse(new TeacherFeedbackEntity());
        
        feedback.setGameSession(session);
        feedback.setStudent(student);
        feedback.setTeacher(teacher);
        
        // Only set comprehension score from results if not already set by teacher
        if (feedback.getComprehensionScore() == null) {
            int score = (int) Math.ceil(result.getComprehensionPercentage() / 20); // 0-100% mapped to 1-5
            feedback.setComprehensionScore(score);
        }
        
        // Set comprehension data
        feedback.setComprehensionQuestions(result.getComprehensionQuestions());
        feedback.setComprehensionAnswers(result.getComprehensionAnswers());
        feedback.setComprehensionPercentage(result.getComprehensionPercentage());
        
        // Save feedback entity
        TeacherFeedbackEntity savedFeedback = feedbackRepository.save(feedback);
        
        // Return DTO
        return convertToDTO(savedFeedback, true);
    }
}