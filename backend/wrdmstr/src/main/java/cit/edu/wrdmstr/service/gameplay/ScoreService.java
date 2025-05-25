package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.entity.ScoreRecordEntity;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.ScoreRecordEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ScoreService {
    private static final Logger logger = LoggerFactory.getLogger(ScoreService.class);
    
    private final ScoreRecordEntityRepository scoreRepository;
    private final PlayerSessionEntityRepository playerRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    public ScoreService(
            ScoreRecordEntityRepository scoreRepository,
            PlayerSessionEntityRepository playerRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.scoreRepository = scoreRepository;
        this.playerRepository = playerRepository;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Award points to a player by session and user IDs
     */
    public void awardPoints(Long sessionId, Long userId, int points, String reason) {
        List<PlayerSessionEntity> players = playerRepository.findBySessionIdAndUserId(sessionId, userId);
        if (players.isEmpty()) {
            logger.warn("Cannot award points: player not found for session {} and user {}", sessionId, userId);
            return;
        }
        
        PlayerSessionEntity player = players.get(0);
        awardPoints(player, points, reason);
        
        // Broadcast updated score to all clients
        Map<String, Object> scoreUpdate = new HashMap<>();
        scoreUpdate.put("playerId", userId);
        scoreUpdate.put("sessionId", sessionId);
        scoreUpdate.put("points", points);
        scoreUpdate.put("reason", reason);
        scoreUpdate.put("totalScore", player.getTotalScore());
        
        // Broadcast to topic for all players
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/scores",
            scoreUpdate
        );
        
        // Also send direct notification to the player
        String userEmail = player.getUser().getEmail();
        messagingTemplate.convertAndSendToUser(
            userEmail,
            "/queue/score",
            scoreUpdate
        );
    }
    
    /**
     * Award points directly to a player entity
     */
    public void awardPoints(PlayerSessionEntity player, int points, String reason) {
        try {
            if (player == null || player.getUser() == null || player.getSession() == null) {
                logger.error("Cannot award points: player, user, or session is null");
                return;
            }
            
            ScoreRecordEntity record = new ScoreRecordEntity();
            record.setSession(player.getSession());
            record.setUser(player.getUser());
            record.setPoints(points);
            record.setReason(reason != null ? reason : "Points awarded");
            record.setTimestamp(new Date());
            
            // Update relationships
            if (player.getUser().getScoreRecords() != null) {
                player.getUser().getScoreRecords().add(record);
            }
            
            if (player.getSession().getScores() != null) {
                player.getSession().getScores().add(record);
            }
            
            // Save record and update player total
            scoreRepository.save(record);
            player.setTotalScore(player.getTotalScore() + points);
            playerRepository.save(player);
            
            logger.info("Awarded {} points to player {} for: {}", 
                points, player.getUser().getEmail(), reason);
        } catch (Exception e) {
            logger.error("Error awarding points: " + e.getMessage(), e);
        }
    }
    
    /**
     * Award grammar-based points with streak tracking
     */
    public void handleGrammarScoring(PlayerSessionEntity player, ChatMessageEntity.MessageStatus status) {
        // Base grammar points based on quality
        int grammarPoints = switch (status) {
            case PERFECT -> 20;
            case MINOR_ERRORS -> 16;
            case MAJOR_ERRORS -> 10;  // Still give 1 point for participation
            case PENDING -> 0;  // Add this case - no points awarded for pending messages
        };
        
        if (grammarPoints > 0) {
            awardPoints(player, grammarPoints, "Grammar: " + status);
            
            // Handle streak bonuses
            player.setGrammarStreak(player.getGrammarStreak() + 1);
            int streak = player.getGrammarStreak();
            
            if (streak >= 2) {
                // Progressive streak bonus
                int bonus = streak * 3;
                awardPoints(player, bonus, "Grammar streak bonus x" + streak);
                
                // Milestone bonuses at key streak levels
                if (streak == 3 || streak == 5 || streak == 8 || streak == 12) {
                    awardPoints(player, 15, "Streak milestone bonus!");
                }
            }
        } else {
            // Only reset streak on major errors, not minor ones
            if (status != ChatMessageEntity.MessageStatus.MAJOR_ERRORS) {
                player.setGrammarStreak(0);
            }
            // For PENDING messages, don't reset the streak - just don't award points yet
        }
        playerRepository.save(player);
    }
    
    /**
     * Award word bank usage points
     */
    public void handleWordBankUsage(PlayerSessionEntity player, List<String> usedWords) {
        if (usedWords == null || usedWords.isEmpty()) {
            return;
        }
        
        // Base points for using any word bank word
        int basePoints = 10;
        
        // Bonus for using multiple words (5 points per additional word)
        int bonusPoints = (usedWords.size() - 1) * 5;
        
        if (usedWords.size() > 2) {
            // Award special bonus for using many words at once
            int specialBonus = 10;
            awardPoints(player, specialBonus, "Amazing! Used " + usedWords.size() + " words at once!");
        }
        
        // Award total points with individual feedback for each word
        for (String word : usedWords) {
            awardPoints(player, basePoints, "Used word bank item: " + word);
        }
        
        // Bonus for using multiple words
        if (usedWords.size() > 1) {
            awardPoints(player, bonusPoints, "Multiple word bonus (" + usedWords.size() + " words)");
        }
    }
    
    /**
     * Award role-appropriate communication points
     */
    public void handleRoleAppropriateScoring(PlayerSessionEntity player, boolean isRoleAppropriate, 
            ChatMessageEntity.MessageStatus grammarStatus) {
        
        if (isRoleAppropriate) {
            int rolePoints = 10;
            
            // Extra points for perfect grammar with role-appropriate content
            if (grammarStatus == ChatMessageEntity.MessageStatus.PERFECT) {
                rolePoints += 5;
            }
            
            awardPoints(player, rolePoints, "Role-appropriate communication");
        }
    }
    
    /**
     * Award points for word length/complexity
     */
    public void handleMessageComplexity(PlayerSessionEntity player, String content) {
        // Reward effort even for shorter messages
        if (content.length() > 20) {
            awardPoints(player, 3, "Good effort bonus");
        }
        
        if (content.length() > 50) {
            awardPoints(player, 5, "Detailed response bonus");
        }
        
        if (content.length() > 100) {
            awardPoints(player, 8, "Extended response bonus");
        }
        
        // Bonus for sentence count
        int sentences = content.split("[.!?]+").length;
        if (sentences > 1) {
            awardPoints(player, sentences * 2, "Multiple sentences bonus");
        }
    }
    
    /**
     * Award exceptional contribution bonus (perfect grammar + word usage + role)
     */
    public void handleExceptionalContribution(Long sessionId, Long userId, String message) {
        // Award special bonus for outstanding contributions
        awardPoints(sessionId, userId, 5, "Exceptional contribution bonus");
        
        // Broadcast notification to all players
        Map<String, Object> exceptionalNotice = new HashMap<>();
        exceptionalNotice.put("type", "exceptionalContribution");
        
        List<PlayerSessionEntity> players = playerRepository.findBySessionIdAndUserId(sessionId, userId);
        if (!players.isEmpty()) {
            PlayerSessionEntity player = players.get(0);
            
            // Include player name and message in the notification
            exceptionalNotice.put("playerName", player.getUser().getFname() + " " + 
                               player.getUser().getLname());
            exceptionalNotice.put("message", message);
            
            // Send notification to all players
            messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId + "/updates", 
                exceptionalNotice
            );
        }
    }
    
    /**
     * Award word bomb points
     */
    public void handleWordBomb(PlayerSessionEntity player, String wordBomb) {
        awardPoints(player, 15, "Word bomb used: " + wordBomb);
    }
    
    /**
     * Award round completion bonus to all active players
     */
    public void awardRoundCompletionBonus(Long sessionId, int roundNumber) {
        // Increasing bonus for later rounds
        int baseBonus = 10 + (roundNumber * 5);
        
        List<PlayerSessionEntity> activePlayers = playerRepository.findBySessionIdAndIsActiveTrue(sessionId);
        for (PlayerSessionEntity player : activePlayers) {
            awardPoints(player, baseBonus, "Round " + roundNumber + " completion bonus");
        }
    }
    
    /**
     * Get session leaderboard
     */
    public List<Map<String, Object>> getSessionLeaderboard(Long sessionId) {
        List<Object[]> totalScores = scoreRepository.getTotalScoresByUser(sessionId);
        
        return totalScores.stream()
            .map(score -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("playerId", score[0]);
                entry.put("score", score[1]);
                return entry;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Get player score breakdown - score by reason
     */
    public List<Map<String, Object>> getPlayerScoreBreakdown(Long sessionId, Long playerId) {
        List<Object[]> breakdown = scoreRepository.getScoreBreakdown(sessionId, playerId);
        
        return breakdown.stream()
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("reason", entry[0]);
                item.put("points", entry[1]);
                return item;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Get all score records for a session
     */
    public List<ScoreRecordEntity> getSessionScoreHistory(Long sessionId) {
        return scoreRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
    
    /**
     * Award points for vocabulary usage quality
     */
    public void handleVocabularyScoring(PlayerSessionEntity player, int vocabularyScore, 
                                        List<String> usedAdvancedWords) {
        // Base vocabulary points
        awardPoints(player, vocabularyScore, "Vocabulary quality");
        
        // Award points for advanced vocabulary
        if (usedAdvancedWords != null && !usedAdvancedWords.isEmpty()) {
            int advancedWordPoints = usedAdvancedWords.size() * 2;
            awardPoints(player, advancedWordPoints, 
                       "Advanced vocabulary: " + String.join(", ", usedAdvancedWords));
        }
        
        // Streaks for consistent sophisticated vocabulary
        // Could track vocabulary streaks similar to grammar streaks
    }

    /**
     * Award points for vocabulary diversity over the game session
     */
    public void handleVocabularyDiversity(PlayerSessionEntity player, Set<String> uniqueWords) {
        // Award points based on total unique words used
        if (uniqueWords.size() > 20) {
            awardPoints(player, 10, "Excellent vocabulary diversity");
        } else if (uniqueWords.size() > 10) {
            awardPoints(player, 5, "Good vocabulary diversity");
        }
    }
}