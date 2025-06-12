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
    
    // Make this static so it's shared across all instances of the service
    private static final Map<String, List<Map<String, Object>>> questionsCache = new ConcurrentHashMap<>();
    
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private AIService aiService;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ComprehensionResultRepository comprehensionResultRepository;
    
    
    /**
     * Generate comprehension questions based on game session content and collaborative story
     */
    public List<Map<String, Object>> generateComprehensionQuestions(Long sessionId, Long studentId) {
        String cacheKey = "session_" + sessionId; // Standardize cache key format
        
        // Synchronize access to prevent multiple threads from generating questions simultaneously
        synchronized(ComprehensionCheckService.class) {
            // Check cache first - session-wide questions
            if (questionsCache.containsKey(cacheKey)) {
                logger.info("Returning cached comprehension questions for session {}", sessionId);
                return questionsCache.get(cacheKey);
            }
            
            logger.info("No cached questions found for session {}. Generating new questions.", sessionId);
            
            GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
            
            // Get ALL messages from the session to build the collaborative story
            List<ChatMessageEntity> allMessages = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
            
            if (allMessages.isEmpty()) {
                logger.warn("No messages found in session {}, creating default questions", sessionId);
                List<Map<String, Object>> defaultQuestions = createDefaultSessionQuestions(session);
                questionsCache.put(cacheKey, defaultQuestions); // Cache the default questions too
                return defaultQuestions;
            }
            
            // Create a session-wide summary without player attributions
            String sessionSummary = generateSessionSummary(session, allMessages);
            
            // Prepare AI request focused on session content
            Map<String, Object> request = new HashMap<>();
            request.put("task", "generate_comprehension_questions");
            request.put("context", sessionSummary);
            request.put("sessionTopic", session.getContent().getTitle());
            request.put("sessionDescription", session.getContent().getDescription());
            
            // Call AI service
            String aiResponse = aiService.callAIModel(request).getResult();
            
            try {
                // Parse AI response into list of question objects
                List<Map<String, Object>> questions = parseComprehensionQuestions(aiResponse);
                
                // Ensure all questions have consistent IDs and formatting
                for (int i = 0; i < questions.size(); i++) {
                    Map<String, Object> question = questions.get(i);
                    question.put("id", i + 1); // Consistent numbering
                    question.put("sessionId", sessionId); // Mark as session-specific
                }
                
                // Cache the questions for the entire session
                questionsCache.put(cacheKey, questions);
                logger.info("Cached {} comprehension questions for session {}", questions.size(), sessionId);
                
                return questions;
            } catch (Exception e) {
                logger.error("Error parsing AI response for comprehension questions: " + e.getMessage(), e);
                List<Map<String, Object>> defaultQuestions = createDefaultSessionQuestions(session);
                questionsCache.put(cacheKey, defaultQuestions); // Cache the default questions too
                return defaultQuestions;
            }
        }
    }
    
    /**
     * Generate a session summary without player attributions
     */
    private String generateSessionSummary(GameSessionEntity session, List<ChatMessageEntity> allMessages) {
        // Create a coherent narrative from messages without attributing to specific players
        StringBuilder storyContent = new StringBuilder();
        
        // First, extract just the message content without attributions
        for (ChatMessageEntity message : allMessages) {
            storyContent.append(message.getContent()).append(" ");
        }
        
        // Build a properly formatted summary
        StringBuilder summary = new StringBuilder();
        summary.append("SESSION TOPIC: ").append(session.getContent().getTitle()).append("\n\n");
        summary.append("SESSION DESCRIPTION: ").append(session.getContent().getDescription()).append("\n\n");
        summary.append("COLLABORATIVE STORY CONTENT:\n\n");
        
        // Format into paragraphs without player names or attributions
        String[] sentences = storyContent.toString().split("(?<=[.!?])\\s+");
        int sentenceCount = 0;
        for (String sentence : sentences) {
            summary.append(sentence).append(" ");
            sentenceCount++;
            if (sentenceCount % 3 == 0) {
                summary.append("\n\n");
            }
        }
        
        return summary.toString();
    }
    
    /**
     * Create default session-based questions when AI fails or no messages exist
     */
    private List<Map<String, Object>> createDefaultSessionQuestions(GameSessionEntity session) {
        List<Map<String, Object>> fallbackQuestions = new ArrayList<>();
        
        Map<String, Object> question1 = new HashMap<>();
        question1.put("id", 1);
        question1.put("sessionId", session.getId());
        question1.put("question", "What was the main topic of this English learning session?");
        question1.put("options", Arrays.asList(
            session.getContent().getTitle(), 
            "Random conversation", 
            "Grammar exercises", 
            "Vocabulary drills"
        ));
        question1.put("correctAnswer", "A");
        question1.put("type", "multiple_choice");
        fallbackQuestions.add(question1);
        
        Map<String, Object> question2 = new HashMap<>();
        question2.put("id", 2);
        question2.put("sessionId", session.getId());
        question2.put("question", "How did the participants work together in this session?");
        question2.put("options", Arrays.asList(
            "They created a collaborative story", 
            "They worked individually", 
            "They only listened", 
            "They copied each other"
        ));
        question2.put("correctAnswer", "A");
        question2.put("type", "multiple_choice");
        fallbackQuestions.add(question2);
        
        Map<String, Object> question3 = new HashMap<>();
        question3.put("id", 3);
        question3.put("sessionId", session.getId());
        question3.put("question", "What was the purpose of this English practice session?");
        question3.put("options", Arrays.asList(
            "To improve English communication skills", 
            "To complete homework", 
            "To take a test", 
            "To learn math"
        ));
        question3.put("correctAnswer", "A");
        question3.put("type", "multiple_choice");
        fallbackQuestions.add(question3);
        
        // Cache the fallback questions too
        String cacheKey = session.getId() + "_session";
        questionsCache.put(cacheKey, fallbackQuestions);
        
        return fallbackQuestions;
    }
    
    // Add method to clear session-based cache
    public void clearSessionQuestionsCache(Long sessionId) {
        String cacheKey = "session_" + sessionId;
        if (questionsCache.remove(cacheKey) != null) {
            logger.info("Cleared comprehension questions cache for session {}", sessionId);
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
        // Remove both old student-specific and new session-based cache entries
        questionsCache.entrySet().removeIf(entry -> 
            entry.getKey().startsWith(sessionId + "_"));
    }
}