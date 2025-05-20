package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus;
import cit.edu.wrdmstr.repository.ChatMessageEntityRepository;
import cit.edu.wrdmstr.repository.MessageReactionEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.ScoreRecordEntityRepository;
import cit.edu.wrdmstr.repository.WordBankItemRepository;
import cit.edu.wrdmstr.service.AIService;
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

        // Grammar check with role assessment
        GrammarCheckerService.GrammarCheckResult grammarResult = 
            grammarCheckerService.checkGrammar(content, roleName, contextDesc);

        // Send role prompt if available
        String rolePrompt = generateRolePrompt(player);
        if (rolePrompt != null) {
            messagingTemplate.convertAndSendToUser(
                player.getUser().getEmail(),
                "/queue/responses",
                Collections.singletonMap("rolePrompt", rolePrompt)
            );
        }
        
        // Create message with all necessary info
        ChatMessageEntity message = new ChatMessageEntity();
        message.setSession(session);
        message.setSender(player.getUser());
        message.setPlayerSession(player);
        message.setContent(content);
        message.setGrammarStatus(grammarResult.getStatus());
        message.setTimestamp(new Date()); // Add this line to set the timestamp

        
        // Truncate grammar feedback if too long (for example, limit to 1000 chars)
        String feedback = grammarResult.getFeedback();
        if (feedback != null && feedback.length() > 2000) {
            feedback = feedback.substring(0, 997) + "...";
        }
        
        message.setGrammarFeedback(feedback);
        
        // Check word bomb
        if (!player.isWordBombUsed() &&
                player.getCurrentWordBomb() != null &&
                !player.getCurrentWordBomb().isEmpty() &&
                content.toLowerCase().contains(player.getCurrentWordBomb().toLowerCase())) {
            
            message.setContainsWordBomb(true);
            player.setWordBombUsed(true);
            
            // Use score service for word bomb points
            scoreService.handleWordBomb(player, player.getCurrentWordBomb());
        }

        // Let score service handle grammar scoring and streaks
        scoreService.handleGrammarScoring(player, grammarResult.getStatus());
        
        // Score service handles word bank usage
        List<WordBankItem> sessionWordBank = wordBankItemRepository.findByContentData(session.getContent().getContentData());
        List<String> usedWordsFromBank = new ArrayList<>();

        for (WordBankItem item : sessionWordBank) {
            String word = item.getWord().toLowerCase();
            // Use word boundary check for more accurate matching
            // This prevents "car" matching in "carpet" for example
            String regex = "\\b" + word + "\\b";
            if (content.toLowerCase().matches(".*" + regex + ".*")) {
                usedWordsFromBank.add(item.getWord());
            }
        }
        
        if (!usedWordsFromBank.isEmpty()) {
            scoreService.handleWordBankUsage(player, usedWordsFromBank);
            message.setWordUsed(String.join(", ", usedWordsFromBank));
        }

        // Score service handles role-appropriate communication
        scoreService.handleRoleAppropriateScoring(player, grammarResult.isRoleAppropriate(), 
                grammarResult.getStatus());

        // Score service handles message complexity/length
        scoreService.handleMessageComplexity(player, content);
        
        // Save and return the message
        return chatMessageRepository.save(message);
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

    public List<ChatMessageEntity> getSessionMessages(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
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
