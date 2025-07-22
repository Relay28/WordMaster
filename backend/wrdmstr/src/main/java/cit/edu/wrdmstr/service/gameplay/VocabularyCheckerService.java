package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.VocabularyResultDTO;
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
    @Autowired private VocabularyResultRepository vocabularyResultRepository;
    @Autowired private WordBankItemRepository wordBankRepository;
    @Autowired private VocabularyAnalysisService vocabularyAnalysisService;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private WordDetectionService wordDetectionService; // Add this field with other @Autowired fields

    
     /**
     * Analyze vocabulary usage in a message
     */
    public VocabularyResultDTO checkVocabulary(String text, Long sessionId, Long userId) {
        // Existing code to identify used words from word bank
        List<String> usedWords = new ArrayList<>();
        List<String> usedAdvancedWords = new ArrayList<>();
        
        // Find all word bank items used in the text
        ContentEntity content = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"))
            .getContent();
            
        // OLD CODE:
        /*
        for (WordBankItem item : content.getContentData().getWordBank()) {
            if (text.toLowerCase().contains(item.getWord().toLowerCase())) {
                usedWords.add(item.getWord());
                
                // Consider words as advanced if they have high complexity or length > 7
                if (item.getComplexity() > 3 || item.getWord().length() > 7) {
                    usedAdvancedWords.add(item.getWord());
                }
            }
        }
        */
        
        // NEW CODE:
        List<WordBankItem> wordBankItems = wordBankItemRepository.findByContentData(content.getContentData());
        List<String> detectedWords = wordDetectionService.detectWordBankUsage(text, wordBankItems);

        for (String detectedWord : detectedWords) {
            usedWords.add(detectedWord);
            
            // Find the corresponding WordBankItem for complexity checking
            WordBankItem correspondingItem = wordBankItems.stream()
                .filter(item -> item.getWord().equalsIgnoreCase(detectedWord))
                .findFirst()
                .orElse(null);
            
            if (correspondingItem != null && 
                (correspondingItem.getComplexity() > 3 || correspondingItem.getWord().length() > 7)) {
                usedAdvancedWords.add(detectedWord);
            }
        }
        
        // Perform advanced vocabulary analysis on entire text
        Map<String, Object> analysis = vocabularyAnalysisService.analyzeVocabulary(text);
        
        // ADD THIS: Get advanced words from the vocabulary analysis service
        List<String> analysisAdvancedWords = (List<String>) analysis.get("advancedWords");
        if (analysisAdvancedWords != null) {
            // Add advanced words found by analysis that aren't already in the list
            for (String advancedWord : analysisAdvancedWords) {
                if (!usedAdvancedWords.contains(advancedWord)) {
                    usedAdvancedWords.add(advancedWord);
                }
            }
        }
        
        // Get AI feedback on vocabulary usage
        Map<String, Object> request = new HashMap<>();
        request.put("task", "vocabulary_check");
        request.put("text", text);
        request.put("usedWords", usedWords);
        // Add the analysis results to the AI request
        request.put("vocabularyAnalysis", analysis);

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            request.put("studentName", user.getFname() + " " + user.getLname());
        }
        
        String feedback = aiService.callAIModel(request).getResult();
        
        // Calculate score - now include the advanced analysis
        int baseScore = usedWords.size() * 2;
        int advancedScore = usedAdvancedWords.size() * 3;
        
        // Add score based on the analysis
        int analysisScore = 0;
        String vocabLevel = (String) analysis.get("vocabularyLevel");
        if ("Advanced".equals(vocabLevel)) {
            analysisScore = 5;
        } else if ("Intermediate-Advanced".equals(vocabLevel)) {
            analysisScore = 3;
        } else if ("Intermediate".equals(vocabLevel)) {
            analysisScore = 1;
        }
        
        int totalScore = baseScore + advancedScore + analysisScore;
        
        // Save vocabulary result
        saveVocabularyResult(sessionId, userId, usedWords, usedAdvancedWords, analysis);
        
        // Convert to DTO and return
        return convertToDTO(totalScore, feedback, usedWords, usedAdvancedWords, sessionId, userId);
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
 * Save vocabulary analysis results to database
 */
private void saveVocabularyResult(Long sessionId, Long userId, List<String> usedWords, 
                                 List<String> usedAdvancedWords, Map<String, Object> analysis) {
    logger.info("Saving vocabulary result - usedWords: {}, usedAdvancedWords: {}", 
                usedWords.size(), usedAdvancedWords.size());
    logger.debug("Advanced words list: {}", usedAdvancedWords);
    
    GameSessionEntity session = gameSessionRepository.findById(sessionId)
        .orElseThrow(() -> new RuntimeException("Session not found"));
    
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));
    
    // Check if a result already exists for this session and user
    VocabularyResultEntity existingResult = vocabularyResultRepository
        .findByGameSessionIdAndStudentId(sessionId, userId).orElse(null);
    
    VocabularyResultEntity result = existingResult != null ? existingResult : new VocabularyResultEntity();
    
    // Set basic properties
    result.setGameSession(session);
    result.setStudent(user);
    
    // Calculate score
    int vocabScore = usedWords.size() * 2 + usedAdvancedWords.size() * 3;
    if ("Advanced".equals(analysis.get("vocabularyLevel"))) {
        vocabScore += 5;
    } else if ("Intermediate-Advanced".equals(analysis.get("vocabularyLevel"))) {
        vocabScore += 3;
    } else if ("Intermediate".equals(analysis.get("vocabularyLevel"))) {
        vocabScore += 1;
    }
    
    result.setVocabularyScore(vocabScore);
    result.setUsedWordsList(usedWords);
    result.setUsedAdvancedWordsList(usedAdvancedWords);
    
    // Save to database
    VocabularyResultEntity savedResult = vocabularyResultRepository.save(result);
    logger.info("Saved vocabulary result with ID: {}, advanced words: {}", 
                savedResult.getId(), savedResult.getUsedAdvancedWords());
}
    
    /**
     * Convert vocabulary check data to DTO
     */
    private VocabularyResultDTO convertToDTO(int score, String feedback, 
                                         List<String> usedWords, 
                                         List<String> usedAdvancedWords, 
                                         Long sessionId, Long userId) {
    // Create new DTO
    VocabularyResultDTO dto = new VocabularyResultDTO();
    
    // Set primary data
    dto.setVocabularyScore(score);
    dto.setUsedWords(usedWords);
    dto.setUsedAdvancedWords(usedAdvancedWords);
    
    // Set identifying information
    dto.setGameSessionId(sessionId);
    dto.setStudentId(userId);
    dto.setFeedback(feedback);
    // Set student name if needed
    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user != null) {
        dto.setStudentName(user.getFname() + " " + user.getLname());
    }
    
    // Add the feedback (you may need to add this field to VocabularyResultDTO)
    
    
    return dto;
}
    
 
}