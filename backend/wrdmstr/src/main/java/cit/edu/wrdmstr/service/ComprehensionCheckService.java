package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.ComprehensionResultDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.checkerframework.checker.units.qual.A;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComprehensionCheckService {
    private static final Logger logger = LoggerFactory.getLogger(ComprehensionCheckService.class);
    
    // Add caching for comprehension questions
    private final Map<String, List<Map<String, Object>>> questionsCache = new ConcurrentHashMap<>();
    
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private AIService aiService;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ComprehensionResultRepository comprehensionResultRepository;
    
    
    /**
     * Generate comprehension questions based on game session content and chat messages
     */
    public List<Map<String, Object>> generateComprehensionQuestions(Long sessionId, Long studentId) {
        String cacheKey = sessionId + "_" + studentId;
        
        // Check cache first
        if (questionsCache.containsKey(cacheKey)) {
            logger.info("Returning cached comprehension questions for session {} and student {}", sessionId, studentId);
            return questionsCache.get(cacheKey);
        }
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Get all messages from the session
        List<ChatMessageEntity> allMessages = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        
        // Get student's messages
        List<ChatMessageEntity> studentMessages = chatMessageRepository
            .findBySessionIdAndSenderIdOrderByTimestampAsc(sessionId, studentId);
        
        if (studentMessages.isEmpty()) {
            throw new RuntimeException("No messages found for this student in the session");
        }
        
        // Prepare context for AI
        StringBuilder context = new StringBuilder();
        context.append("Session Topic: ").append(session.getContent().getTitle()).append("\n\n");
        context.append("Session Description: ").append(session.getContent().getDescription()).append("\n\n");
        
        context.append("Conversation Transcript (last 10 messages):\n");
        List<ChatMessageEntity> recentMessages = allMessages.size() > 10 
            ? allMessages.subList(allMessages.size() - 10, allMessages.size()) 
            : allMessages;
            
        for (ChatMessageEntity message : recentMessages) {
            String senderName = message.getSender().getFname() + " " + message.getSender().getLname();
            context.append(senderName).append(": ").append(message.getContent()).append("\n");
        }
        
        // Prepare AI request
        Map<String, Object> request = new HashMap<>();
        request.put("task", "generate_comprehension_questions");
        request.put("context", context.toString());
        request.put("studentName", student.getFname() + " " + student.getLname());
        
        // Get student's role
        String studentRole = "Participant"; // Default role
        
        // Find the player session for this student to get their role
        for (PlayerSessionEntity player : session.getPlayers()) {
            if (Objects.equals(player.getUser().getId(), studentId) && player.getRole() != null) {
                studentRole = player.getRole().getName();
                break;
            }
        }
        request.put("studentRole", studentRole);
        
        // Call AI service
        String aiResponse = aiService.callAIModel(request).getResult();
        
        try {
            // Parse AI response into list of question objects
            List<Map<String, Object>> questions = parseComprehensionQuestions(aiResponse);
            
            // Cache the questions
            questionsCache.put(cacheKey, questions);
            logger.info("Cached comprehension questions for session {} and student {}", sessionId, studentId);
            
            // Return the questions
            return questions;
        } catch (Exception e) {
            logger.error("Error parsing AI response for comprehension questions: " + e.getMessage(), e);
            
            // Fallback to a simple list if parsing fails
            List<Map<String, Object>> fallbackQuestions = new ArrayList<>();
            Map<String, Object> question = new HashMap<>();
            question.put("id", 1);
            question.put("question", "What was the main topic discussed in this conversation?");
            question.put("options", Arrays.asList(
                "Option A", "Option B", "Option C", "Option D"
            ));
            question.put("correctAnswer", "Option A");
            question.put("type", "multiple_choice");
            fallbackQuestions.add(question);
            
            return fallbackQuestions;
        }
    }
    
    /**
     * Grade comprehension answers and calculate percentage
     */
    public Map<String, Object> gradeComprehensionAnswers(
            List<Map<String, Object>> questions, 
            List<Map<String, Object>> answers) {
        
        int totalQuestions = questions.size();
        int correctAnswers = 0;
        List<Map<String, Object>> gradedAnswers = new ArrayList<>();
        
        for (Map<String, Object> answer : answers) {
            int questionId = ((Number) answer.get("questionId")).intValue();
            String studentAnswer = (String) answer.get("answer");
            
            // Find the corresponding question
            Optional<Map<String, Object>> questionOpt = questions.stream()
                .filter(q -> ((Number) q.get("id")).intValue() == questionId)
                .findFirst();
                
            if (questionOpt.isPresent()) {
                Map<String, Object> question = questionOpt.get();
                String correctAnswer = (String) question.get("correctAnswer");
                String questionType = (String) question.get("type");
                
                boolean isCorrect = false;
                
                // Grade based on question type
                if ("multiple_choice".equals(questionType)) {
                    isCorrect = studentAnswer.equals(correctAnswer);
                } else if ("true_false".equals(questionType)) {
                    isCorrect = studentAnswer.equalsIgnoreCase(correctAnswer);
                } else if ("short_answer".equals(questionType)) {
                    // For short answers, we'll need to use AI to evaluate
                    Map<String, Object> request = new HashMap<>();
                    request.put("task", "evaluate_short_answer");
                    request.put("question", question.get("question"));
                    request.put("expectedAnswer", correctAnswer);
                    request.put("studentAnswer", studentAnswer);
                    
                    String evaluation = aiService.callAIModel(request).getResult();
                    isCorrect = evaluation.toLowerCase().contains("correct");
                }
                
                if (isCorrect) {
                    correctAnswers++;
                }
                
                // Add to graded answers - ensure isCorrect is stored as boolean
                Map<String, Object> gradedAnswer = new HashMap<>(answer);
                gradedAnswer.put("isCorrect", isCorrect);
                gradedAnswer.put("correctAnswer", correctAnswer);
                gradedAnswer.put("questionText", question.get("question")); // Add question text for reference
                gradedAnswers.add(gradedAnswer);
            }
        }
        
        // Calculate percentage
        double percentage = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0;
        
        // Create result map
        Map<String, Object> result = new HashMap<>();
        result.put("totalQuestions", totalQuestions);
        result.put("correctAnswers", correctAnswers);
        result.put("percentage", Math.round(percentage * 100.0) / 100.0); // Round to 2 decimal places
        result.put("gradedAnswers", gradedAnswers);
        
        return result;
    }
    
    /**
     * Parse the AI response into a list of question objects
     */
    private List<Map<String, Object>> parseComprehensionQuestions(String aiResponse) {
        List<Map<String, Object>> questions = new ArrayList<>();
        
        // Try to parse as JSON first
        try {
            questions = objectMapper.readValue(aiResponse, new TypeReference<List<Map<String, Object>>>() {});
            return questions;
        } catch (JsonProcessingException e) {
            // If not valid JSON, try to parse the structured text format
            logger.debug("Response is not valid JSON, trying to parse structured text: " + aiResponse);
        }
        
        // Parse structured text format (fallback)
        String[] lines = aiResponse.split("\n");
        Map<String, Object> currentQuestion = null;
        List<String> currentOptions = null;
        int questionCount = 0;
        
        for (String line : lines) {
            line = line.trim();
            
            if (line.isEmpty()) continue;
            
            if (line.matches("\\d+\\..*") || line.toLowerCase().startsWith("question")) {
                // New question
                if (currentQuestion != null) {
                    // Add previous question if exists
                    currentQuestion.put("options", currentOptions);
                    questions.add(currentQuestion);
                }
                
                questionCount++;
                currentQuestion = new HashMap<>();
                currentQuestion.put("id", questionCount);
                currentQuestion.put("question", line.replaceAll("^\\d+\\.\\s*|^Question\\s+\\d+:\\s*", "").trim());
                currentQuestion.put("type", "multiple_choice"); // Default type
                currentOptions = new ArrayList<>();
            } else if (line.matches("[A-D]\\..*") || line.matches("\\([A-D]\\).*")) {
                // Option
                if (currentOptions != null) {
                    String option = line.replaceAll("^[A-D]\\.\\s*|^\\([A-D]\\)\\s*", "").trim();
                    currentOptions.add(option);
                }
            } else if (line.toLowerCase().startsWith("correct answer") || line.toLowerCase().startsWith("answer")) {
                // Correct answer
                if (currentQuestion != null) {
                    String answer = line.replaceAll("(?i)^Correct Answer:\\s*|^Answer:\\s*", "").trim();
                    currentQuestion.put("correctAnswer", answer);
                }
            } else if (line.toLowerCase().contains("true/false") || line.toLowerCase().contains("true or false")) {
                // Convert true/false to multiple choice
                if (currentQuestion != null) {
                    currentQuestion.put("type", "multiple_choice");
                    currentOptions = Arrays.asList("True", "False");
                }
            } else if (line.toLowerCase().contains("short answer")) {
                // Convert short answer to multiple choice with generic options
                if (currentQuestion != null) {
                    currentQuestion.put("type", "multiple_choice");
                        currentOptions = Arrays.asList(
                       "This is significant because of his ambition to become known throughout the kingdom.",
                            "This matters because it shows his diplomatic approach to royal interactions.", 
                            "His words are important because they demonstrate his military strength.",
                            "The significance lies in his humility and modest aspirations."
                        );
                    
                }
            }
        }
        
        // Add the last question
        if (currentQuestion != null) {
            currentQuestion.put("options", currentOptions);
            questions.add(currentQuestion);
        }
        
        // Final pass to ensure all questions have proper type and options
        for (Map<String, Object> q : questions) {
            // Force all questions to multiple choice
            q.put("type", "multiple_choice");
            
            // Ensure all questions have options
            @SuppressWarnings("unchecked")
            List<String> opts = (List<String>) q.get("options");
            if (opts == null || opts.isEmpty()) {
                q.put("options", Arrays.asList(
                    "Option A", "Option B", "Option C", "Option D"
                ));
            }
        }

        return questions;
    }
    
    /**
     * Get comprehension results for a session
     */
    public List<ComprehensionResultDTO> getResultsBySession(Long sessionId, Authentication auth) {
        // Verify authorization
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
            
        // Check if user is the teacher or a student in this session
        boolean isTeacher = Objects.equals(session.getTeacher().getId(), user.getId());
        boolean isStudentInSession = session.getPlayers().stream()
            .anyMatch(p -> p.getUser().getId()==(user.getId()));
            
        if (!isTeacher && !isStudentInSession) {
            throw new RuntimeException("You are not authorized to view these results");
        }
        
        // Get results from repository
        List<ComprehensionResultEntity> results = comprehensionResultRepository.findByGameSessionId(sessionId);
        
        // Convert to DTOs
        return results.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Get comprehension results for a student
     */
    public List<ComprehensionResultDTO> getResultsByStudent(Long studentId, Authentication auth) {
        // Verify authorization
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Only allow users to see their own results or teachers
        boolean isSelf = Objects.equals(user.getId(), studentId);
        boolean isTeacher = "USER_TEACHER".equals(user.getRole());
        
        if (!isSelf && !isTeacher) {
            throw new RuntimeException("You are not authorized to view these results");
        }
        
        // Get results from repository
        List<ComprehensionResultEntity> results = comprehensionResultRepository.findByStudentId(studentId);
        
        // Convert to DTOs
        return results.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Get a specific comprehension result
     */
    public ComprehensionResultDTO getResult(Long sessionId, Long studentId, Authentication auth) {
        // Verify authorization
        UserEntity user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Only allow users to see their own results or teachers
        boolean isSelf = Objects.equals(user.getId(), studentId);
        boolean isTeacher = "USER_TEACHER".equals(user.getRole());
        
        if (!isSelf && !isTeacher) {
            throw new RuntimeException("You are not authorized to view these results");
        }
        
        // Get result from repository
        ComprehensionResultEntity result = comprehensionResultRepository
            .findByGameSessionIdAndStudentId(sessionId, studentId)
            .orElseThrow(() -> new RuntimeException("Result not found"));
        
        // Convert to DTO
        return convertToDTO(result);
    }
    
    /**
     * Convert entity to DTO
     */
    private ComprehensionResultDTO convertToDTO(ComprehensionResultEntity entity) {
        ComprehensionResultDTO dto = new ComprehensionResultDTO();
        dto.setId(entity.getId());
        dto.setGameSessionId(entity.getGameSession().getId());
        dto.setStudentId(entity.getStudent().getId());
        dto.setStudentName(entity.getStudent().getFname() + " " + entity.getStudent().getLname());
        dto.setComprehensionPercentage(entity.getComprehensionPercentage());
        dto.setCreatedAt(entity.getCreatedAt());
        
        // Convert JSON strings to objects
        try {
            if (entity.getComprehensionQuestions() != null) {
                dto.setComprehensionQuestions(objectMapper.readValue(
                    entity.getComprehensionQuestions(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                ));
            }
            
            if (entity.getComprehensionAnswers() != null) {
                dto.setComprehensionAnswers(objectMapper.readValue(
                    entity.getComprehensionAnswers(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                ));
            }
        } catch (JsonProcessingException e) {
            logger.error("Error parsing comprehension data: " + e.getMessage(), e);
        }
        
        return dto;
    }
    
    // Add method to clear cache when needed
    public void clearQuestionsCache(Long sessionId) {
        questionsCache.entrySet().removeIf(entry -> entry.getKey().startsWith(sessionId + "_"));
    }
}