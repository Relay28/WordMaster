package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class VocabularyCheckerService {
    private static final Logger logger = LoggerFactory.getLogger(VocabularyCheckerService.class);
    
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private AIService aiService;
    @Autowired private GrammarCheckerService grammarCheckerService;
    @Autowired private WordBankItemRepository wordBankRepository;
    
    /**
     * Analyze vocabulary usage in a message
     */
    public VocabularyCheckResult checkVocabulary(String text, Long sessionId, Long userId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
            
        // Get word bank for the session
        List<WordBankItem> wordBank = wordBankRepository.findByContentData(session.getContent().getContentData());
        
        // Check for word bank usage
        List<String> usedWords = new ArrayList<>();
        List<String> usedAdvancedWords = new ArrayList<>();
        for (WordBankItem item : wordBank) {
            String word = item.getWord().toLowerCase();
            String regex = "\\b" + word + "\\b";
            if (text.toLowerCase().matches(".*" + regex + ".*")) {
                usedWords.add(item.getWord());
                
                // Consider words as advanced if they have high complexity or length > 7
                if (item.getComplexity() > 3 || item.getWord().length() > 7) {
                    usedAdvancedWords.add(item.getWord());
                }
            }
        }
        
        // Get AI feedback on vocabulary usage
        Map<String, Object> request = new HashMap<>();
        request.put("task", "vocabulary_check");
        request.put("text", text);
        request.put("usedWords", usedWords);
        
        String feedback = aiService.callAIModel(request).getResult();
        
        // Calculate score based on word bank usage and complexity
        int score = calculateVocabularyScore(text, usedWords);
        
        return new VocabularyCheckResult(score, feedback, usedWords, usedAdvancedWords);
    }
    
    /**
     * Calculate vocabulary score based on word usage and complexity
     */
    private int calculateVocabularyScore(String text, List<String> usedWords) {
        int baseScore = usedWords.size() * 5; // 5 points per word bank word
        
        // Additional points for complexity
        String[] words = text.split("\\s+");
        int longWordCount = 0;
        
        for (String word : words) {
            if (word.length() > 6) { // Consider words > 6 letters as complex
                longWordCount++;
            }
        }
        
        int complexityScore = longWordCount * 2; // 2 points per complex word
        
        return baseScore + complexityScore;
    }
    
    /**
     * Generate vocabulary exercises based on session content
     */
    public List<Map<String, Object>> generateVocabularyExercises(Long sessionId, Long studentId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
            
        UserEntity student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
            
        // Get word bank for the session
        List<WordBankItem> wordBank = wordBankRepository.findByContentData(session.getContent().getContentData());
        
        // Get student's messages to analyze vocabulary usage
        List<ChatMessageEntity> messages = chatMessageRepository
            .findBySessionIdAndSenderIdOrderByTimestampAsc(sessionId, studentId);
            
        // Identify words the student has already used
        Set<String> usedWords = new HashSet<>();
        for (ChatMessageEntity message : messages) {
            if (message.getWordUsed() != null && !message.getWordUsed().isEmpty()) {
                usedWords.addAll(Arrays.asList(message.getWordUsed().split(", ")));
            }
        }
        
        // Create AI request for vocabulary exercises
        Map<String, Object> request = new HashMap<>();
        request.put("task", "generate_vocabulary_exercises");
        request.put("wordBank", wordBank.stream().map(WordBankItem::getWord).collect(Collectors.toList()));
        request.put("usedWords", usedWords);
        request.put("studentName", student.getFname() + " " + student.getLname());
        
        String aiResponse = aiService.callAIModel(request).getResult();
        
        // Parse AI response into exercises
        return parseVocabularyExercises(aiResponse);
    }
    
    /**
     * Parse AI response into vocabulary exercises
     */
    private List<Map<String, Object>> parseVocabularyExercises(String aiResponse) {
        List<Map<String, Object>> exercises = new ArrayList<>();
        
        // Parsing logic similar to ComprehensionCheckService's parseComprehensionQuestions
        // ... no exersises to be added yet 
        
        return exercises;
    }
    
    /**
     * Result class for vocabulary checks
     */
    public static class VocabularyCheckResult {
        private final int score;
        private final String feedback;
        private final List<String> usedWords;
        private final List<String> usedAdvancedWords;
        
        public VocabularyCheckResult(int score, String feedback, List<String> usedWords) {
            this.score = score;
            this.feedback = feedback;
            this.usedWords = usedWords;
            this.usedAdvancedWords = new ArrayList<>();
        }
        
        public VocabularyCheckResult(int score, String feedback, List<String> usedWords, List<String> usedAdvancedWords) {
            this.score = score;
            this.feedback = feedback;
            this.usedWords = usedWords;
            this.usedAdvancedWords = usedAdvancedWords;
        }
        
        public int getScore() {
            return score;
        }
        
        public String getFeedback() {
            return feedback;
        }
        
        public List<String> getUsedWords() {
            return usedWords;
        }
        
        public List<String> getUsedAdvancedWords() {
            return usedAdvancedWords;
        }
    }
}