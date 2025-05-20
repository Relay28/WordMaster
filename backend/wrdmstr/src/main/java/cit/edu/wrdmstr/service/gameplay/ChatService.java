package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
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

        String rolePrompt = generateRolePrompt(player);
        if (rolePrompt != null) {
            messagingTemplate.convertAndSendToUser(
                player.getUser().getEmail(),
                "/queue/responses",
                Collections.singletonMap("rolePrompt", rolePrompt)
            );
        }
        
        // Create message
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
        try {
            if (!player.isWordBombUsed() &&
                    player.getCurrentWordBomb() != null &&
                    !player.getCurrentWordBomb().isEmpty() &&
                    content.toLowerCase().contains(player.getCurrentWordBomb().toLowerCase())) {

                message.setContainsWordBomb(true);
                player.setWordBombUsed(true);
                awardPoints(player, 5, "Word bomb: " + player.getCurrentWordBomb());
            }
        } catch (Exception e) {
            // Log the error but don't fail the message submission
            System.err.println("Error processing word bomb: " + e.getMessage());
        }

        // Grammar scoring
        int grammarPoints = switch (grammarResult.getStatus()) {
            case PERFECT -> 10;
            case MINOR_ERRORS -> 5;
            case MAJOR_ERRORS -> 0;
        };

        if (grammarPoints > 0) {
            awardPoints(player, grammarPoints, "Grammar: " + grammarResult.getStatus());
            player.setGrammarStreak(player.getGrammarStreak() + 1);

            // Grammar streak bonus
            if (player.getGrammarStreak() >= 3) {
                int bonus = player.getGrammarStreak() * 2;
                awardPoints(player, bonus, "Grammar streak x" + player.getGrammarStreak());
            }
        } else {
            player.setGrammarStreak(0);
        }

        playerSessionRepository.save(player);

        // Add to user's sent messages
        player.getUser().getSentMessages().add(message);

        // Add to session's messages
        session.getMessages().add(message);

        // Check for word bank usage
        List<WordBankItem> sessionWordBank = wordBankItemRepository.findByContentData(session.getContent().getContentData());
        boolean usedWordBankItem = false;
        String wordUsed = null;

        for (WordBankItem item : sessionWordBank) {
            String word = item.getWord().toLowerCase();
            if (content.toLowerCase().contains(word)) {
                usedWordBankItem = true;
                wordUsed = item.getWord();
                break;
            }
        }

        if (usedWordBankItem) {
            // Award points for using word bank item
            awardPoints(player, 15, "Used word bank item: " + wordUsed);
            message.setWordUsed(wordUsed);
        }

        // Later in the method, add role-appropriate bonus points
        if (grammarResult.isRoleAppropriate()) {
            int roleBonus = 10;
            awardPoints(player, roleBonus, "Role-appropriate communication");
        }

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

    private void awardPoints(PlayerSessionEntity player, int points, String reason) {
        try {
            if (player == null || player.getUser() == null || player.getSession() == null) {
                System.err.println("Error awarding points: Player, user, or session is null");
                return;
            }
            
            ScoreRecordEntity record = new ScoreRecordEntity();
            record.setSession(player.getSession());
            record.setUser(player.getUser());
            record.setPoints(points);
            record.setReason(reason != null ? reason : "Points awarded");
            record.setTimestamp(new Date());

            player.getUser().getScoreRecords().add(record);
            player.getSession().getScores().add(record);

            scoreRecordRepository.save(record);
            player.setTotalScore(player.getTotalScore() + points);
            System.out.println("Points awarded: " + points + " to player " + player.getUser().getEmail() + " for: " + reason);
        } catch (Exception e) {
            System.err.println("Error awarding points: " + e.getMessage());
            e.printStackTrace();
        }
    }

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
