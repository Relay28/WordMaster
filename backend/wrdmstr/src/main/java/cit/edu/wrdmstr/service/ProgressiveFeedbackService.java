package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.repository.ChatMessageEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressiveFeedbackService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProgressiveFeedbackService.class);
    
    @Autowired
    private ChatMessageEntityRepository chatMessageRepository;
    
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;
    
    // Predefined encouraging messages for different scenarios
    private static final Map<String, List<String>> ENCOURAGEMENT_MESSAGES = new HashMap<>();
    
    static {
        // Perfect messages
        ENCOURAGEMENT_MESSAGES.put("PERFECT_FIRST", Arrays.asList(
            "✨ Excellent English! You're off to a great start!",
            "🌟 Perfect grammar! Keep up the amazing work!",
            "👏 Outstanding! Your English skills are showing!"
        ));
        
        ENCOURAGEMENT_MESSAGES.put("PERFECT_STREAK", Arrays.asList(
            "🔥 Incredible streak! You're mastering English grammar!",
            "⚡ Amazing consistency! Your hard work is paying off!",
            "🏆 Fantastic streak! You're becoming an English expert!"
        ));
        
        ENCOURAGEMENT_MESSAGES.put("PERFECT_IMPROVING", Arrays.asList(
            "📈 Great improvement! Your practice is showing results!",
            "🌱 Look at you grow! Your English is getting stronger!",
            "💪 Excellent progress! You're getting better with each message!"
        ));
        
        // Minor errors messages
        ENCOURAGEMENT_MESSAGES.put("MINOR_IMPROVING", Arrays.asList(
            "📊 Good progress! You're getting closer to perfect English!",
            "🎯 Almost there! Your improvement is noticeable!",
            "💡 Nice work! Small fixes and you'll have it perfect!"
        ));
        
        ENCOURAGEMENT_MESSAGES.put("MINOR_CONSISTENT", Arrays.asList(
            "👍 Good effort! Your English understanding is solid!",
            "🔧 Good attempt! Just a small tweak needed!",
            "⭐ Well done! You're expressing your ideas clearly!"
        ));
        
        // Major errors messages
        ENCOURAGEMENT_MESSAGES.put("MAJOR_SUPPORTIVE", Arrays.asList(
            "🌱 Keep practicing! Every sentence helps you learn!",
            "💪 Don't give up! Learning English takes time and practice!",
            "🎯 Good try! Focus on one improvement at a time!",
            "🌟 You're learning! Mistakes help us grow stronger!"
        ));
        
        ENCOURAGEMENT_MESSAGES.put("MAJOR_IMPROVING", Arrays.asList(
            "📈 I see improvement! Keep pushing forward!",
            "🌈 You're getting better! Your effort is showing!",
            "💫 Progress spotted! You're moving in the right direction!"
        ));
        
        // Role-specific encouragements
        ENCOURAGEMENT_MESSAGES.put("ROLE_APPROPRIATE", Arrays.asList(
            "🎭 Perfect role-playing! You really understand your character!",
            "🎪 Great character work! You're staying true to your role!",
            "🎨 Excellent role portrayal! Your character feels real!"
        ));
        
        // Vocabulary achievements
        ENCOURAGEMENT_MESSAGES.put("VOCABULARY_ACHIEVEMENT", Arrays.asList(
            "📚 Great vocabulary choice! You're expanding your word power!",
            "🧠 Smart word usage! Your vocabulary is growing!",
            "💎 Excellent word selection! You're building strong English skills!"
        ));
    }
    
    /**
     * Generate progressive feedback based on user's recent performance
     */
    public String generateProgressiveFeedback(Long userId, Long sessionId, String currentMessage, 
                                            MessageStatus grammarStatus, boolean isRoleAppropriate, 
                                            int vocabularyScore) {
        try {
            // Get recent messages from this user (last 10 messages)
            List<ChatMessageEntity> recentMessages = getRecentMessages(userId, sessionId, 10);
            
            // Analyze performance patterns
            PerformanceAnalysis analysis = analyzePerformance(recentMessages);
            
            // Get user's role for context
            String userRole = getUserRole(userId, sessionId);
            
            // Build comprehensive feedback
            return buildComprehensiveFeedback(grammarStatus, isRoleAppropriate, vocabularyScore, 
                                            analysis, userRole, currentMessage);
            
        } catch (Exception e) {
            logger.error("Error generating progressive feedback for user {} in session {}: {}", 
                        userId, sessionId, e.getMessage());
            return getDefaultFeedback(grammarStatus);
        }
    }
    
    /**
     * Get recent messages from user in chronological order
     */
    private List<ChatMessageEntity> getRecentMessages(Long userId, Long sessionId, int limit) {
        // Get messages from last hour to avoid very old sessions
        Date oneHourAgo = Date.from(LocalDateTime.now().minusHours(1).atZone(ZoneId.systemDefault()).toInstant());
        
        return chatMessageRepository.findBySessionIdAndSenderIdAndTimestampAfterOrderByTimestampDesc(
            sessionId, userId, oneHourAgo)
            .stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    /**
     * Analyze user's performance patterns
     */
    private PerformanceAnalysis analyzePerformance(List<ChatMessageEntity> recentMessages) {
        PerformanceAnalysis analysis = new PerformanceAnalysis();
        
        if (recentMessages.isEmpty()) {
            return analysis;
        }
        
        // Reverse to get chronological order (oldest first)
        Collections.reverse(recentMessages);
        
        // Analyze trends
        analysis.totalMessages = recentMessages.size();
        analysis.perfectCount = (int) recentMessages.stream()
            .filter(msg -> msg.getGrammarStatus() == MessageStatus.PERFECT)
            .count();
        analysis.minorErrorCount = (int) recentMessages.stream()
            .filter(msg -> msg.getGrammarStatus() == MessageStatus.MINOR_ERRORS)
            .count();
        analysis.majorErrorCount = (int) recentMessages.stream()
            .filter(msg -> msg.getGrammarStatus() == MessageStatus.MAJOR_ERRORS)
            .count();
        
        // Calculate consecutive streaks
        analysis.currentPerfectStreak = calculateCurrentStreak(recentMessages, MessageStatus.PERFECT);
        analysis.longestPerfectStreak = calculateLongestStreak(recentMessages, MessageStatus.PERFECT);
        
        // Analyze improvement trend (compare first half vs second half)
        analysis.isImproving = analyzeImprovementTrend(recentMessages);
        
        // Calculate role appropriateness
        analysis.roleAppropriateCount = (int) recentMessages.stream()
            .filter(ChatMessageEntity::isRoleAppropriate)
            .count();
        
        // Calculate average vocabulary score
        analysis.averageVocabularyScore = recentMessages.stream()
            .mapToInt(ChatMessageEntity::getVocabularyScore)
            .average()
            .orElse(0.0);
        
        // Check for word bomb usage
        analysis.wordBombUsageCount = (int) recentMessages.stream()
            .filter(ChatMessageEntity::isContainsWordBomb)
            .count();
        
        return analysis;
    }
    
    /**
     * Calculate current consecutive streak of a specific status
     */
    private int calculateCurrentStreak(List<ChatMessageEntity> messages, MessageStatus targetStatus) {
        int streak = 0;
        
        // Start from the most recent message and count backwards
        for (int i = messages.size() - 1; i >= 0; i--) {
            if (messages.get(i).getGrammarStatus() == targetStatus) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    /**
     * Calculate longest streak of a specific status
     */
    private int calculateLongestStreak(List<ChatMessageEntity> messages, MessageStatus targetStatus) {
        int maxStreak = 0;
        int currentStreak = 0;
        
        for (ChatMessageEntity message : messages) {
            if (message.getGrammarStatus() == targetStatus) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return maxStreak;
    }
    
    /**
     * Analyze if user is improving by comparing recent performance
     */
    private boolean analyzeImprovementTrend(List<ChatMessageEntity> messages) {
        if (messages.size() < 4) {
            return false; // Not enough data
        }
        
        int midPoint = messages.size() / 2;
        List<ChatMessageEntity> firstHalf = messages.subList(0, midPoint);
        List<ChatMessageEntity> secondHalf = messages.subList(midPoint, messages.size());
        
        // Calculate success rate for each half (Perfect + Minor as acceptable)
        double firstHalfSuccess = firstHalf.stream()
            .mapToDouble(msg -> {
                if (msg.getGrammarStatus() == MessageStatus.PERFECT) return 1.0;
                if (msg.getGrammarStatus() == MessageStatus.MINOR_ERRORS) return 0.7;
                return 0.0;
            })
            .average().orElse(0.0);
        
        double secondHalfSuccess = secondHalf.stream()
            .mapToDouble(msg -> {
                if (msg.getGrammarStatus() == MessageStatus.PERFECT) return 1.0;
                if (msg.getGrammarStatus() == MessageStatus.MINOR_ERRORS) return 0.7;
                return 0.0;
            })
            .average().orElse(0.0);
        
        return secondHalfSuccess > firstHalfSuccess + 0.1; // 10% improvement threshold
    }
    
    /**
     * Get user's role in the current session
     */
    private String getUserRole(Long userId, Long sessionId) {
        try {
            List<PlayerSessionEntity> playerSessions = playerSessionRepository
                .findActiveBySessionIdAndUserId(sessionId, userId);
            
            if (!playerSessions.isEmpty() && playerSessions.get(0).getRole() != null) {
                return playerSessions.get(0).getRole().getName();
            }
        } catch (Exception e) {
            logger.warn("Could not fetch user role for user {} in session {}: {}", 
                       userId, sessionId, e.getMessage());
        }
        return "student";
    }
    
    /**
     * Build comprehensive feedback message
     */
    private String buildComprehensiveFeedback(MessageStatus grammarStatus, boolean isRoleAppropriate,
                                            int vocabularyScore, PerformanceAnalysis analysis, 
                                            String userRole, String currentMessage) {
        // Choose ONE primary feedback message instead of stacking multiple
        String primaryFeedback = getPrimaryFeedback(grammarStatus, analysis);
        
        // Add ONE additional element based on priority
        if (analysis.currentPerfectStreak >= 3) {
            return primaryFeedback + " " + getRandomMessage("PERFECT_STREAK");
        } else if (vocabularyScore >= 7) {
            return primaryFeedback + " " + getRandomMessage("VOCABULARY_ACHIEVEMENT");
        } else if (isRoleAppropriate && grammarStatus != MessageStatus.MAJOR_ERRORS) {
            return primaryFeedback + " " + getRandomMessage("ROLE_APPROPRIATE");
        }
        
        return primaryFeedback;
    }
    
    /**
     * Get primary feedback based on grammar status and performance
     */
    private String getPrimaryFeedback(MessageStatus grammarStatus, PerformanceAnalysis analysis) {
        switch (grammarStatus) {
            case PERFECT:
                if (analysis.currentPerfectStreak >= 3) {
                    return getRandomMessage("PERFECT_STREAK");
                } else if (analysis.isImproving) {
                    return getRandomMessage("PERFECT_IMPROVING");
                } else {
                    return getRandomMessage("PERFECT_FIRST");
                }
                
            case MINOR_ERRORS:
                if (analysis.isImproving) {
                    return getRandomMessage("MINOR_IMPROVING");
                } else {
                    return getRandomMessage("MINOR_CONSISTENT");
                }
                
            case MAJOR_ERRORS:
                if (analysis.isImproving) {
                    return getRandomMessage("MAJOR_IMPROVING");
                } else {
                    return getRandomMessage("MAJOR_SUPPORTIVE");
                }
                
            default:
                return "Keep practicing your English! 📚";
        }
    }
    
    /**
     * Get achievement-based feedback
     */
    private String getAchievementFeedback(PerformanceAnalysis analysis) {
        List<String> achievements = new ArrayList<>();
        
        // Streak achievements
        if (analysis.currentPerfectStreak >= 5) {
            achievements.add("🏆 Amazing 5+ perfect streak!");
        } else if (analysis.longestPerfectStreak >= 3) {
            achievements.add("🎯 Great consistency in your grammar!");
        }
        
        // Overall performance achievements
        if (analysis.totalMessages >= 5) {
            double successRate = (double) (analysis.perfectCount + analysis.minorErrorCount) / analysis.totalMessages;
            if (successRate >= 0.8) {
                achievements.add("⭐ Excellent overall performance!");
            } else if (successRate >= 0.6) {
                achievements.add("👍 Good consistent effort!");
            }
        }
        
        // Role playing achievement
        if (analysis.totalMessages >= 3) {
            double roleSuccessRate = (double) analysis.roleAppropriateCount / analysis.totalMessages;
            if (roleSuccessRate >= 0.8) {
                achievements.add("🎭 Fantastic role-playing skills!");
            }
        }
        
        // Word bomb achievement
        if (analysis.wordBombUsageCount >= 2) {
            achievements.add("💣 Great job using challenging words!");
        }
        
        // Vocabulary achievement
        if (analysis.averageVocabularyScore >= 7.0) {
            achievements.add("📖 Outstanding vocabulary usage!");
        }
        
        return achievements.isEmpty() ? "" : achievements.get(0);
    }
    
    /**
     * Get improvement tips based on current performance
     */
    private String getImprovementTip(MessageStatus grammarStatus, PerformanceAnalysis analysis, String userRole) {
        if (grammarStatus == MessageStatus.PERFECT && analysis.currentPerfectStreak >= 2) {
            return ""; // No tips needed for consistent perfect performance
        }
        
        List<String> tips = new ArrayList<>();
        
        // Grammar tips
        if (grammarStatus == MessageStatus.MAJOR_ERRORS) {
            tips.add("💡 Try shorter sentences to build confidence!");
            tips.add("📝 Remember: Subject + Verb + Object structure!");
            tips.add("🔤 Check your spelling and verb tenses!");
        } else if (grammarStatus == MessageStatus.MINOR_ERRORS) {
            tips.add("✨ Almost perfect! Check your punctuation!");
            tips.add("🔍 Review your sentence structure once more!");
        }
        
        // Role-specific tips
        if (analysis.roleAppropriateCount < analysis.totalMessages * 0.6) {
            tips.add("🎭 Think about how a " + userRole + " would speak!");
        }
        
        // Vocabulary tips
        if (analysis.averageVocabularyScore < 5.0) {
            tips.add("📚 Try using words from the word bank!");
            tips.add("🌟 Add descriptive words to make it interesting!");
        }
        
        return tips.isEmpty() ? "" : tips.get(new Random().nextInt(tips.size()));
    }
    
    /**
     * Get random message from a category
     */
    private String getRandomMessage(String category) {
        List<String> messages = ENCOURAGEMENT_MESSAGES.get(category);
        if (messages == null || messages.isEmpty()) {
            return "";
        }
        return messages.get(new Random().nextInt(messages.size()));
    }
    
    /**
     * Get default feedback when analysis fails
     */
    private String getDefaultFeedback(MessageStatus grammarStatus) {
        switch (grammarStatus) {
            case PERFECT:
                return "✨ Excellent English! Keep up the great work! 🌟";
            case MINOR_ERRORS:
                return "👍 Good effort! You're doing well! 💪";
            case MAJOR_ERRORS:
                return "🌱 Keep practicing! You're learning and growing! 📚";
            default:
                return "Great job participating! Keep using English! 🎯";
        }
    }
    
    /**
     * Inner class to hold performance analysis data
     */
    private static class PerformanceAnalysis {
        int totalMessages = 0;
        int perfectCount = 0;
        int minorErrorCount = 0;
        int majorErrorCount = 0;
        int currentPerfectStreak = 0;
        int longestPerfectStreak = 0;
        boolean isImproving = false;
        int roleAppropriateCount = 0;
        double averageVocabularyScore = 0.0;
        int wordBombUsageCount = 0;
    }
}