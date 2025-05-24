package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.ChatMessageDTO;
import cit.edu.wrdmstr.dto.VocabularyResultDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.ProgressTrackingService;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus.*;


@Service
@Transactional
public class ChatService {
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


    public ChatMessageEntity sendMessage(Long sessionId, Long userId, String content) {
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        PlayerSessionEntity player = players.isEmpty() ?
                null : players.get(0);

        if (player == null) {
            throw new ResourceNotFoundException("Player not found in session");
        }

        GameSessionEntity session = player.getSession();

        String roleName = player.getRole() != null ? player.getRole().getName() : null;
        String contextDesc = session.getContent() != null ? session.getContent().getDescription() : "";

        // Grammar check
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
        message.setContent(content);
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
        
        // Check word bomb
        if (!player.isWordBombUsed() &&
                player.getCurrentWordBomb() != null &&
                !player.getCurrentWordBomb().isEmpty() &&
                content.toLowerCase().contains(player.getCurrentWordBomb().toLowerCase())) {

            message.setContainsWordBomb(true);
            player.setWordBombUsed(true);
            scoreService.handleWordBomb(player, player.getCurrentWordBomb());
        }

        // Handle scoring
        scoreService.handleGrammarScoring(player, grammarResult.getStatus());
        // Award vocabulary points
        scoreService.handleVocabularyScoring(
            player, 
            vocabResult.getVocabularyScore(),
            vocabResult.getUsedAdvancedWords()
        );

        // Check for word bank usage
        List<WordBankItem> sessionWordBank = wordBankItemRepository.findByContentData(session.getContent().getContentData());
        List<String> usedWordsFromBank = new ArrayList<>();

        for (WordBankItem item : sessionWordBank) {
            String word = item.getWord().toLowerCase();
            String regex = "\\b" + word + "\\b";
            if (content.toLowerCase().matches(".*" + regex + ".*")) {
                usedWordsFromBank.add(item.getWord());
            }
        }

        if (!usedWordsFromBank.isEmpty()) {
            scoreService.handleWordBankUsage(player, usedWordsFromBank);
            message.setWordUsed(String.join(", ", usedWordsFromBank));
        }

        scoreService.handleRoleAppropriateScoring(player, grammarResult.isRoleAppropriate(),
                grammarResult.getStatus());
        scoreService.handleMessageComplexity(player, content);

        // Save the message
        ChatMessageEntity savedMessage = chatMessageRepository.save(message);

        // Broadcast the message to all players
        broadcastChatMessage(savedMessage);
        updateProgressMetrics(player, message,session);

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
}
