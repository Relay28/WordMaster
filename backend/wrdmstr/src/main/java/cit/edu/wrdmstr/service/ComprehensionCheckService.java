package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComprehensionCheckService {
    private static final Logger logger = LoggerFactory.getLogger(ComprehensionCheckService.class);
    
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private AIService aiService;
    @Autowired private ObjectMapper objectMapper;
    
    /**
     * Generate comprehension questions based on game session content and chat messages
     */
    public List<Map<String, Object>> generateComprehensionQuestions(Long sessionId, Long studentId) {
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
                
                // Add to graded answers
                Map<String, Object> gradedAnswer = new HashMap<>(answer);
                gradedAnswer.put("isCorrect", isCorrect);
                gradedAnswer.put("correctAnswer", correctAnswer);
                gradedAnswers.add(gradedAnswer);
            }
        }
        
        // Calculate percentage
        double percentage = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0;
        
        // Create result map
        Map<String, Object> result = new HashMap<>();
        result.put("totalQuestions", totalQuestions);
        result.put("correctAnswers", correctAnswers);
        result.put("percentage", percentage);
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
                // True/False question
                if (currentQuestion != null) {
                    currentQuestion.put("type", "true_false");
                    currentOptions = Arrays.asList("True", "False");
                }
            } else if (line.toLowerCase().contains("short answer")) {
                // Short answer question
                if (currentQuestion != null) {
                    currentQuestion.put("type", "short_answer");
                }
            }
        }
        
        // Add the last question
        if (currentQuestion != null) {
            currentQuestion.put("options", currentOptions);
            questions.add(currentQuestion);
        }
        
        return questions;
    }
}