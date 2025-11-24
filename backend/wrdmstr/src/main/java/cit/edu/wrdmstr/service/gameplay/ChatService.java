package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.ChatMessageDTO;
import cit.edu.wrdmstr.dto.VocabularyResultDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.ProgressiveFeedbackService;
import cit.edu.wrdmstr.service.gameplay.ProfanityFilterService;
import cit.edu.wrdmstr.service.ProgressTrackingService;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

import static cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus.*;


@Service
@Transactional
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(GameSessionManagerService.class); 
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private ScoreRecordEntityRepository scoreRecordRepository;
    @Autowired private MessageReactionEntityRepository messageReactionRepository;
    @Autowired private GrammarCheckerService grammarCheckerService;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private AIService aiService;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private ScoreService scoreService;
    @Autowired private ProgressTrackingService progressTrackingService;
    @Autowired private StudentProgressRepository progressRepository;

    @Autowired private VocabularyCheckerService vocabularyCheckerService;
    @Autowired private WordDetectionService wordDetectionService;
    @Autowired 
    private ProgressiveFeedbackService progressiveFeedbackService;
    @Autowired
    private ProfanityFilterService profanityFilterService;
    @Autowired
    private OptimizedTextProcessor optimizedTextProcessor; // Add for performance improvements


    public ChatMessageEntity sendMessage(Long sessionId, Long userId, String content) {
        // Use the new active-only query
        List<PlayerSessionEntity> players = playerSessionRepository.findActiveBySessionIdAndUserId(sessionId, userId);
        PlayerSessionEntity player = null;
        
        if (players.isEmpty()) {
            throw new ResourceNotFoundException("Active player not found in session");
        } else if (players.size() == 1) {
            player = players.get(0);
        } else {
            // This shouldn't happen with the active-only query, but handle it just in case
            logger.error("Multiple active player sessions found for user {} in session {}. This indicates a data integrity issue.", 
                    userId, sessionId);
            player = players.get(0); // Use the first one
        }

        GameSessionEntity session = player.getSession();

        String roleName = player.getRole() != null ? player.getRole().getName() : null;
        String contextDesc = session.getContent() != null ? session.getContent().getDescription() : "";

        // Profanity filtering BEFORE any analysis so masked content is stored/broadcast
        ProfanityFilterService.Result profanityResult = profanityFilterService.filter(content);
        if (profanityResult.hasProfanity()) {
            logger.info("[Profanity] Detected in session {} user {}: {}", sessionId, userId, profanityResult.getMatches());
            scoreService.applyProfanityPenalty(player, profanityResult.getMatches().stream().findFirst().orElse(null));
        }
        content = profanityResult.getFilteredText();

        // Grammar check (runs on filtered text; acceptable tradeoff per requirements)
        GrammarCheckerService.GrammarCheckResult grammarResult = 
                grammarCheckerService.checkGrammar(content, roleName, contextDesc);
        
        // Add vocabulary check
        VocabularyResultDTO vocabResult = 
                vocabularyCheckerService.checkVocabulary(content, sessionId, userId);
        
        // Create message with all necessary info
        ChatMessageEntity message = new ChatMessageEntity();
        message.setSession(session);
        message.setSender(player.getUser());
        message.setPlayerSession(player);
    message.setContent(content); // already filtered if profanity present
        message.setGrammarStatus(grammarResult.getStatus());
        message.setGrammarFeedback(grammarResult.getFeedback());
        message.setVocabularyScore(vocabResult.getVocabularyScore());
        message.setVocabularyFeedback(vocabResult.getFeedback());
        message.setTimestamp(new Date());

        message.setRoleAppropriate(grammarResult.isRoleAppropriate());

        message.setWordUsed(String.join(", ", vocabResult.getUsedWords()));

        // Truncate grammar feedback if too long
        String grammarFeedback = grammarResult.getFeedback();
        if (grammarFeedback != null && grammarFeedback.length() > 2000) {
            grammarFeedback = grammarFeedback.substring(0, 1997) + "...";
        }
        message.setGrammarFeedback(grammarFeedback);
        
        // Add truncation for vocabulary feedback too
        String vocabFeedback = vocabResult.getFeedback();
        if (vocabFeedback != null && vocabFeedback.length() > 2000) {
            vocabFeedback = vocabFeedback.substring(0, 1997) + "...";
        }
        message.setVocabularyFeedback(vocabFeedback);
        

        // Check word bomb BEFORE saving message
        checkAndHandleWordBomb(message, player, content);

        // Handle scoring
        scoreService.handleGrammarScoring(player, grammarResult.getStatus());
        // Additional numeric penalty deduction if applied
        if (grammarResult.isNumericPenaltyApplied()) {
            int penalty = 5; // base deduction; could externalize later
            scoreService.awardPoints(player, -penalty, "Numbers not allowed in grammar message");
        }
        // Award vocabulary points
        scoreService.handleVocabularyScoring(
            player, 
            vocabResult.getVocabularyScore(),
            vocabResult.getUsedAdvancedWords()
        );

        // Check for word bank usage
        List<WordBankItem> sessionWordBank = wordBankItemRepository.findByContentData(session.getContent().getContentData());
        List<String> usedWordsFromBank = wordDetectionService.detectWordBankUsage(content, sessionWordBank);

        if (!usedWordsFromBank.isEmpty()) {
            scoreService.handleWordBankUsage(player, usedWordsFromBank);
            message.setWordUsed(String.join(", ", usedWordsFromBank));
            
            // Extract the actual text variations for frontend highlighting
            List<String> textVariations = wordDetectionService.extractTextVariations(content, usedWordsFromBank);
            message.setWordVariations(String.join(", ", textVariations));
        }

        scoreService.handleRoleAppropriateScoring(player, grammarResult.isRoleAppropriate(),
                grammarResult.getStatus());
        scoreService.handleMessageComplexity(player, content);

        // Save the message
        ChatMessageEntity savedMessage = chatMessageRepository.save(message);

        // Broadcast the message to all players
        broadcastChatMessage(savedMessage);
        updateProgressMetrics(player, message,session);

        // Debug logging
        logger.debug("Word bomb check: player={}, wordBomb='{}', content='{}'", 
            player.getUser().getId(), player.getCurrentWordBomb(), content);

        logger.debug("Vocabulary feedback: score={}, feedback='{}'", 
            vocabResult.getVocabularyScore(), vocabResult.getFeedback());

        // After saving message:
        logger.debug("Saved message: id={}, containsWordBomb={}, vocabFeedback='{}'", 
            savedMessage.getId(), savedMessage.isContainsWordBomb(), 
            savedMessage.getVocabularyFeedback());

        // Use only the concise grammar feedback tip (no verbose progressive feedback)
        message.setGrammarFeedback(grammarResult.getFeedback());

        return savedMessage;
    }
    
    private void updateProgressMetrics(PlayerSessionEntity player, ChatMessageEntity message,GameSessionEntity session) {
        StudentProgress progress = progressRepository.findByStudentIdAndSessionId(
                        player.getUser().getId(), player.getSession().getId())
                .orElseGet(() -> {
                    StudentProgress newProgress = new StudentProgress();
                    newProgress.setStudent(player.getUser());
                    newProgress.setSession(player.getSession());
                    return newProgress;
                });

        // Update counts
        progress.setTotalMessages(progress.getTotalMessages() + 1);
        progress.setTotalWordsUsed(progress.getTotalWordsUsed() +
                message.getContent().split("\\s+").length);

        if (message.getGrammarStatus() == MessageStatus.PERFECT) {
            progress.setTotalPerfectGrammar(progress.getTotalPerfectGrammar() + 1);
        } else if (message.getGrammarStatus() == MessageStatus.PENDING) {
            // Don't count pending messages in perfect grammar stats yet
            // This will be updated when the message analysis completes
        }

        if (message.isContainsWordBomb()) {
            progress.setTotalWordBombsUsed(progress.getTotalWordBombsUsed() + 1);
        }
        progress.setComprehensionScore( progressTrackingService.calculateComprehensionScore(player, session));
        // Recalculate percentages
        if (progress.getTotalMessages() > 0) {
            progress.setGrammarAccuracy(
                    (progress.getTotalPerfectGrammar() * 100.0) / progress.getTotalMessages());
            progress.setWordBombUsageRate(
                    (progress.getTotalWordBombsUsed() * 100.0) / progress.getTotalMessages());

            // Simple comprehension score based on message length and word usage
            double comprehensionScore = Math.min(100.0,
                    (message.getContent().length() > 20 ? 1 : 0) * 100.0 +
                            (message.getWordUsed() != null ? 20 : 0));
            progress.setComprehensionScore(
                    (progress.getComprehensionScore() * (progress.getTotalMessages() - 1) + comprehensionScore)
                            / progress.getTotalMessages());
        }

        progress.setUpdatedAt(new Date());
        progressRepository.save(progress);
    }


            @Autowired private ApplicationEventPublisher eventPublisher;
    private void broadcastChatMessage(ChatMessageEntity message) {
        Map<String, Object> chatMessage = new HashMap<>();
        chatMessage.put("id", message.getId());
        chatMessage.put("senderId", message.getSender().getId());
        chatMessage.put("senderName", message.getSender().getFname() + " " + message.getSender().getLname());
        chatMessage.put("content", message.getContent());
        chatMessage.put("timestamp", message.getTimestamp());
        chatMessage.put("grammarStatus", message.getGrammarStatus().toString());
        chatMessage.put("grammarFeedback", message.getGrammarFeedback());
        chatMessage.put("containsWordBomb", message.isContainsWordBomb());
        chatMessage.put("wordUsed", message.getWordUsed());
        chatMessage.put("wordVariations", message.getWordVariations()); // Actual text variations for frontend bolding
        chatMessage.put("roleAppropriate", message.isRoleAppropriate()); // Add this line to include roleAppropriate flag

        if (message.getPlayerSession() != null && message.getPlayerSession().getRole() != null) {
            chatMessage.put("role", message.getPlayerSession().getRole().getName());
        }

        messagingTemplate.convertAndSend("/topic/game/" + message.getSession().getId() + "/chat", chatMessage);
    }


    public MessageReactionEntity addReaction(Long messageId, Long userId, String emoji) {
        try {
            if (messageId == null || userId == null || emoji == null || emoji.isEmpty()) {
                throw new IllegalArgumentException("Message ID, User ID, and emoji must be provided");
            }
            
            ChatMessageEntity message = chatMessageRepository.findById(messageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Message not found with ID: " + messageId));

            UserEntity user = message.getSender();
            if (user == null) {
                throw new IllegalArgumentException("Message has no sender");
            }

            // Check if reaction already exists
            messageReactionRepository.findByMessageIdAndUserId(messageId, userId)
                    .ifPresent(mr -> {
                        throw new IllegalStateException("User already reacted to this message");
                    });

            MessageReactionEntity reaction = new MessageReactionEntity();
            reaction.setMessage(message);
            reaction.setUser(user);
            reaction.setEmoji(emoji);

            message.getReactions().add(reaction);
            user.getReactions().add(reaction);

            return messageReactionRepository.save(reaction);
        } catch (ResourceNotFoundException | IllegalArgumentException | IllegalStateException e) {
            // Rethrow these as they're expected exceptions with messages for the client
            throw e;
        } catch (Exception e) {
            // Log and wrap any unexpected exceptions
            System.err.println("Error adding reaction: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to add reaction: " + e.getMessage(), e);
        }
    }

    // Removed the awardPoints method as it's now in ScoreService
    @Transactional
    public List<ChatMessageDTO> getSessionMessages(Long sessionId) {
        List<ChatMessageEntity> messages = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        List<ChatMessageDTO> messageDTOs = new ArrayList<>();
        for (ChatMessageEntity message : messages) {
            ChatMessageDTO dto = new ChatMessageDTO();
            dto.setId(message.getId());
            dto.setSenderId(message.getSender() != null ? message.getSender().getId() : null);
            dto.setSenderName(message.getSender() != null ? message.getSender().getFname() + " " + message.getSender().getLname() : null);
            dto.setContent(message.getContent());
            dto.setTimestamp(message.getTimestamp());
            dto.setGrammarStatus(message.getGrammarStatus() != null ? message.getGrammarStatus().toString() : null);
            dto.setGrammarFeedback(message.getGrammarFeedback());
            dto.setContainsWordBomb(message.isContainsWordBomb());
            dto.setWordUsed(message.getWordUsed());
            dto.setWordVariations(message.getWordVariations()); // Actual text variations for frontend bolding
            dto.setRoleAppropriate(message.isRoleAppropriate()); // Add this line to include roleAppropriate flag
            dto.setRole(message.getPlayerSession() != null && message.getPlayerSession().getRole() != null
                    ? message.getPlayerSession().getRole().getName()
                    : null);

            messageDTOs.add(dto);
        }

        return messageDTOs;
    }

    // Add this method to generate role-specific prompts
    private String generateRolePrompt(PlayerSessionEntity player) {
        if (player == null || player.getRole() == null) {
            return null;
        }
        
        String roleName = player.getRole().getName();
        String context = "";
        
        if (player.getSession() != null && player.getSession().getContent() != null) {
            context = player.getSession().getContent().getDescription();
        }
        
        if (roleName == null || roleName.isEmpty()) {
            return null;
        }
        
        Map<String, Object> request = new HashMap<>();
        request.put("task", "role_prompt");
        request.put("role", roleName);
        request.put("context", context != null ? context : "general conversation");
        
        try {
            AIService.AIResponse response = aiService.callAIModel(request);
            return response != null ? response.getResult() : null;
        } catch (Exception e) {
            // Log the error and return a default prompt
            System.err.println("Error generating role prompt: " + e.getMessage());
            return "Remember to stay in character as " + roleName + " during the conversation.";
        }
    }

    @Async("chatProcessingExecutor")
    public ChatMessageEntity sendMessageOptimized(Long sessionId, Long userId, String content, boolean isSinglePlayer) {
        try {
            if (isSinglePlayer) {
                return sendMessageSinglePlayerOptimized(sessionId, userId, content);
            } else {
                return sendMessage(sessionId, userId, content); // Standard processing
            }
        } catch (Exception e) {
            logger.error("Error in optimized message sending: ", e);
            throw e;
        }
    }
    @Transactional
    private ChatMessageEntity sendMessageSinglePlayerOptimized(Long sessionId, Long userId, String content) {
        List<PlayerSessionEntity> players = playerSessionRepository.findActiveBySessionIdAndUserId(sessionId, userId);
        PlayerSessionEntity player = players.isEmpty() ? null : players.get(0);
        
        if (player == null) {
            throw new ResourceNotFoundException("Active player not found in session");
        }
        
        GameSessionEntity session = player.getSession();
        
        // Create message with basic info first
        ChatMessageEntity message = new ChatMessageEntity();
        message.setSession(session);
        message.setSender(player.getUser());
        message.setPlayerSession(player);
        // Profanity filtering for single-player path BEFORE saving
        ProfanityFilterService.Result profanityResult = profanityFilterService.filter(content);
        if (profanityResult.hasProfanity()) {
            logger.info("[Profanity] (Single-player) session {} user {}: {}", sessionId, userId, profanityResult.getMatches());
            scoreService.applyProfanityPenalty(player, profanityResult.getMatches().stream().findFirst().orElse(null));
        }
        content = profanityResult.getFilteredText();
        message.setContent(content);
        message.setTimestamp(new Date());
        message.setGrammarStatus(MessageStatus.PENDING); // Keep as PENDING initially
        message.setGrammarFeedback("Processing...");
        
        // Do immediate word bomb check before saving
        checkAndHandleWordBomb(message, player, content);
        
        // Save message with current word bomb status
        ChatMessageEntity savedMessage = chatMessageRepository.save(message);
        
        // Broadcast with current status
        broadcastChatMessage(savedMessage);
        
        // Continue with async analysis...
        CompletableFuture.runAsync(() -> {
            processMessageAnalysisAsync(savedMessage, player, session);
        });
        
        return savedMessage;
    }

    @Async("analysisExecutor")
    private void processMessageAnalysisAsync(ChatMessageEntity message, PlayerSessionEntity player, GameSessionEntity session) {
        try {
            String content = message.getContent();
            String roleName = player.getRole() != null ? player.getRole().getName() : null;
            String contextDesc = session.getContent() != null ? session.getContent().getDescription() : "";
            
            // Run grammar and vocabulary checks in parallel
            CompletableFuture<GrammarCheckerService.GrammarCheckResult> grammarFuture = 
                CompletableFuture.supplyAsync(() -> 
                    grammarCheckerService.checkGrammar(content, roleName, contextDesc));
                    
            CompletableFuture<VocabularyResultDTO> vocabFuture = 
                CompletableFuture.supplyAsync(() -> 
                    vocabularyCheckerService.checkVocabulary(content, session.getId(), player.getUser().getId()));
            
            // Wait for both to complete
            CompletableFuture.allOf(grammarFuture, vocabFuture).thenRun(() -> {
                try {
                    GrammarCheckerService.GrammarCheckResult grammarResult = grammarFuture.get();
                    VocabularyResultDTO vocabResult = vocabFuture.get();
                    
                    // Update message with results
                    updateMessageWithAnalysis(message, grammarResult, vocabResult, player, session);
                    
                } catch (Exception e) {
                    logger.error("Error processing analysis results: ", e);
                    // Set fallback status if analysis fails
                    message.setGrammarStatus(MessageStatus.MINOR_ERRORS);
                    message.setGrammarFeedback("Analysis temporarily unavailable");
                    chatMessageRepository.save(message);
                    broadcastChatMessage(message);
                }
            });
            
        } catch (Exception e) {
            logger.error("Error in async message analysis: ", e);
        }
    }
    
    @Transactional
    private void updateMessageWithAnalysis(ChatMessageEntity message, 
                                         GrammarCheckerService.GrammarCheckResult grammarResult,
                                         VocabularyResultDTO vocabResult,
                                         PlayerSessionEntity player,
                                         GameSessionEntity session) {
        
        // Use only the concise grammar feedback tip (no verbose progressive feedback)
        message.setGrammarStatus(grammarResult.getStatus());
        message.setGrammarFeedback(grammarResult.getFeedback());
        message.setVocabularyScore(vocabResult.getVocabularyScore());
        
        // Handle vocabulary feedback display
        if (vocabResult.getVocabularyScore() > 0) {
            String vocabFeedback = String.format(
                "Vocabulary Score: %d/10 🌟 %s", 
                vocabResult.getVocabularyScore(),
                vocabResult.getFeedback()
            );
            message.setVocabularyFeedback(truncateFeedback(vocabFeedback));
        } else {
            message.setVocabularyFeedback(truncateFeedback(vocabResult.getFeedback()));
        }
        
        message.setRoleAppropriate(grammarResult.isRoleAppropriate());
        message.setWordUsed(String.join(", ", vocabResult.getUsedWords()));
        
        // Handle word bomb check
        checkAndHandleWordBomb(message, player, message.getContent());
        
        // Save updated message
        chatMessageRepository.save(message);
        
        // Broadcast updated message
        broadcastChatMessage(message);
        // Resume timer for single-player optimized flow (analysis complete)
        try {
            if (session.getPlayers() != null && session.getPlayers().size() == 1) {
                eventPublisher.publishEvent(new TimerResumeEvent(session.getId()));
            }
        } catch (Exception ex) {
            logger.error("Failed to publish TimerResumeEvent", ex);
        }
        
        // Handle scoring asynchronously
        CompletableFuture.runAsync(() -> {
            try {
                scoreService.handleGrammarScoring(player, grammarResult.getStatus());
                scoreService.handleVocabularyScoring(player, vocabResult.getVocabularyScore(), vocabResult.getUsedAdvancedWords());
                scoreService.handleRoleAppropriateScoring(player, grammarResult.isRoleAppropriate(), grammarResult.getStatus());
                scoreService.handleMessageComplexity(player, message.getContent());
                
                // Update progress metrics
                updateProgressMetrics(player, message, session);
                
            } catch (Exception e) {
                logger.error("Error in async scoring: ", e);
            }
        });
    }
    
    private void checkAndHandleWordBomb(ChatMessageEntity message, PlayerSessionEntity player, String content) {
        if (!player.isWordBombUsed() &&
                player.getCurrentWordBomb() != null &&
                !player.getCurrentWordBomb().isEmpty()) {
        
            String wordBomb = player.getCurrentWordBomb().toLowerCase();
            String regex = "\\b" + Pattern.quote(wordBomb) + "\\b";
        
            logger.debug("Checking word bomb: '{}' against content: '{}'", wordBomb, content);
            
            if (content.toLowerCase().matches(".*" + regex + ".*")) {
                message.setContainsWordBomb(true);
                player.setWordBombUsed(true);
                
                // Explicitly save the player with updated word bomb status
                playerSessionRepository.save(player);
                
                scoreService.handleWordBomb(player, player.getCurrentWordBomb());
                
                logger.info("Word bomb '{}' detected for player {} in session {}", 
                           wordBomb, player.getUser().getId(), player.getSession().getId());
            } else {
                logger.debug("Word bomb '{}' NOT found in content", wordBomb);
            }
        } else {
            logger.debug("Word bomb check skipped - already used: {}, bomb: '{}'", 
                    player.isWordBombUsed(), player.getCurrentWordBomb());
        }
    }
    
    private String truncateFeedback(String feedback) {
        return feedback != null && feedback.length() > 2000 ? feedback.substring(0, 1997) + "..." : feedback;
    }
}