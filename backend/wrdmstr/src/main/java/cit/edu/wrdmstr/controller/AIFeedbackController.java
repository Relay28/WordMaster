package cit.edu.wrdmstr.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.ChatMessageEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import cit.edu.wrdmstr.service.AIService;

@RestController
@RequestMapping("/api/ai-feedback")

public class AIFeedbackController {

    private final AIService aiService;
    private final ChatMessageEntityRepository chatRepository;
    private final PlayerSessionEntityRepository playerRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public AIFeedbackController(AIService aiService, 
                                ChatMessageEntityRepository chatRepository, 
                                PlayerSessionEntityRepository playerRepository,
                                UserRepository userRepository) {
        this.aiService = aiService;
        this.chatRepository = chatRepository;
        this.playerRepository = playerRepository;
        this.userRepository = userRepository;
    }
    
    @GetMapping("/generate/{sessionId}/{studentId}")
    public ResponseEntity<?> generateAIFeedback(@PathVariable Long sessionId, 
                                                @PathVariable Long studentId) {
        try {
            // Get player session data
            PlayerSessionEntity playerSession = playerRepository.findBySessionIdAndUserId(sessionId, studentId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Player session not found"));
            
            // Get student information
            UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
            
            // Get sample messages from student
            List<ChatMessageEntity> messages = chatRepository.findBySessionIdAndSenderIdOrderByTimestampAsc(
                sessionId, studentId);
            
            // Sample up to 5 messages for analysis
            List<String> sampleMessages = messages.stream()
                .limit(5)
                .map(ChatMessageEntity::getContent)
                .collect(Collectors.toList());
            
            // Prepare AI request
            Map<String, Object> request = new HashMap<>();
            request.put("task", "generate_feedback");
            request.put("studentName", student.getFname() + " " + student.getLname());  // Add student name
            request.put("role", playerSession.getRole());
            request.put("totalScore", playerSession.getTotalScore());
            request.put("messageCount", messages.size());
            request.put("perfectGrammarCount", countPerfectGrammarMessages(messages));
            request.put("wordBankUsageCount", countWordBankUsages(messages));
            request.put("sampleMessages", sampleMessages);
            
            // Call AI service
            AIService.AIResponse aiResponse = aiService.callAIModel(request);
            
            // Return result
            Map<String, String> result = new HashMap<>();
            result.put("feedback", aiResponse.getResult());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    private int countPerfectGrammarMessages(List<ChatMessageEntity> messages) {
        return (int) messages.stream()
            .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
            .count();
    }
    
    private int countWordBankUsages(List<ChatMessageEntity> messages) {
        return messages.stream()
            .mapToInt(m -> {
                String wordUsed = m.getWordUsed();
                if (wordUsed == null || wordUsed.isEmpty()) {
                    return 0;
                }
                // Count comma-separated words
                return wordUsed.split(",\\s*").length;
            })
            .sum();
    }
}