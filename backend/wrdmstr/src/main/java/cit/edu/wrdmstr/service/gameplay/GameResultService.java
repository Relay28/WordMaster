package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameResultService {
    @Autowired private GameSessionEntityRepository gameSessionRepo;
    @Autowired private PlayerSessionEntityRepository playerSessionRepo;
    @Autowired private ChatMessageEntityRepository chatMessageRepo;
    @Autowired private GrammarResultRepository grammarResultRepo;
    @Autowired private VocabularyResultRepository vocabResultRepo;
    
    public void processEndGameResults(Long sessionId) {
        GameSessionEntity session = gameSessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
            
        List<PlayerSessionEntity> players = playerSessionRepo.findBySessionId(sessionId);
        
        for (PlayerSessionEntity player : players) {
            processPlayerResults(session, player);
        }
    }
    
    private void processPlayerResults(GameSessionEntity session, PlayerSessionEntity player) {
        // Process grammar results
        GrammarResultEntity grammarResult = processGrammarResults(session, player);
        
        // Process vocabulary results
        VocabularyResultEntity vocabResult = processVocabularyResults(session, player);
        
        // Save entities
        grammarResultRepo.save(grammarResult);
        vocabResultRepo.save(vocabResult);
    }
    
    private GrammarResultEntity processGrammarResults(GameSessionEntity session, PlayerSessionEntity player) {
        List<ChatMessageEntity> messages = chatMessageRepo.findByPlayerSessionId(player.getId());
        
        // Calculate grammar stats - exclude PENDING messages from accuracy calculation
        Map<ChatMessageEntity.MessageStatus, Integer> breakdown = new HashMap<>();
        breakdown.put(ChatMessageEntity.MessageStatus.PERFECT, 0);
        breakdown.put(ChatMessageEntity.MessageStatus.MINOR_ERRORS, 0);
        breakdown.put(ChatMessageEntity.MessageStatus.MAJOR_ERRORS, 0);
        breakdown.put(ChatMessageEntity.MessageStatus.PENDING, 0);
        
        for (ChatMessageEntity msg : messages) {
            ChatMessageEntity.MessageStatus status = msg.getGrammarStatus();
            if (status != null) {
                breakdown.put(status, breakdown.getOrDefault(status, 0) + 1);
            }
        }
        
        GrammarResultEntity result = new GrammarResultEntity();
        result.setGameSession(session);
        result.setStudent(player.getUser());
        result.setPerfectCount(breakdown.getOrDefault(ChatMessageEntity.MessageStatus.PERFECT, 0));
        result.setMinorErrorsCount(breakdown.getOrDefault(ChatMessageEntity.MessageStatus.MINOR_ERRORS, 0));
        result.setMajorErrorsCount(breakdown.getOrDefault(ChatMessageEntity.MessageStatus.MAJOR_ERRORS, 0));
        result.setGrammarStreak(player.getGrammarStreak());
        
        // Calculate accuracy excluding PENDING messages
        int totalAssessedMessages = result.getPerfectCount() + result.getMinorErrorsCount() + result.getMajorErrorsCount();
        double accuracy = totalAssessedMessages > 0 ? (double)result.getPerfectCount() / totalAssessedMessages * 100.0 : 0.0;
        result.setGrammarAccuracy(accuracy);
        
        return result;
    }
    
    private VocabularyResultEntity processVocabularyResults(GameSessionEntity session, PlayerSessionEntity player) {
        List<ChatMessageEntity> messages = chatMessageRepo.findByPlayerSessionId(player.getId());
        
        // Extract used words
        List<String> usedWords = messages.stream()
            .filter(m -> m.getWordUsed() != null && !m.getWordUsed().isEmpty())
            .flatMap(m -> List.of(m.getWordUsed().split(",\\s*")).stream())
            .distinct()
            .collect(Collectors.toList());
        
        // Identify advanced words (this is a simplified approach)
        List<String> advancedWords = usedWords.stream()
            .filter(word -> word.length() > 7)  // Simple heuristic
            .collect(Collectors.toList());
        
        // Calculate vocabulary score
        // This is simplified - in a real implementation you'd want to pull from VocabularyCheckerService
        int vocabScore = usedWords.size() * 5 + advancedWords.size() * 5;
        
        VocabularyResultEntity result = new VocabularyResultEntity();
        result.setGameSession(session);
        result.setStudent(player.getUser());
        result.setVocabularyScore(vocabScore);
        result.setUsedWordsList(usedWords);
        result.setUsedAdvancedWordsList(advancedWords);
        
        return result;
    }
}