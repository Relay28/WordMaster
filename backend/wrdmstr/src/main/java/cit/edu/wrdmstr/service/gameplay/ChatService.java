package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.ChatMessageEntityRepository;
import cit.edu.wrdmstr.repository.MessageReactionEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.ScoreRecordEntityRepository;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

import static cit.edu.wrdmstr.entity.ChatMessageEntity.MessageStatus.*;


@Service
@Transactional
public class ChatService {
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private ScoreRecordEntityRepository scoreRecordRepository;
    @Autowired private MessageReactionEntityRepository messageReactionRepository;
    @Autowired private GrammarCheckerService grammarCheckerService;

    public ChatMessageEntity sendMessage(Long sessionId, Long userId, String content) {
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        PlayerSessionEntity player = players.isEmpty() ? 
            null : players.get(0);
            
        if (player == null) {
            throw new ResourceNotFoundException("Player not found in session");
        }

        GameSessionEntity session = player.getSession();

        // Grammar check
        GrammarCheckerService.GrammarCheckResult grammarResult = grammarCheckerService.checkGrammar(content);

        // Create message
        ChatMessageEntity message = new ChatMessageEntity();
        message.setSession(session);
        message.setSender(player.getUser());
        message.setPlayerSession(player);
        message.setContent(content);
        message.setGrammarStatus(grammarResult.getStatus());
        message.setGrammarFeedback(grammarResult.getFeedback());
        message.setTimestamp(new Date());

        // Check word bomb
        if (!player.isWordBombUsed() &&
                player.getCurrentWordBomb() != null &&
                content.toLowerCase().contains(player.getCurrentWordBomb().toLowerCase())) {

            message.setContainsWordBomb(true);
            player.setWordBombUsed(true);
            awardPoints(player, 5, "Word bomb: " + player.getCurrentWordBomb());
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

        return chatMessageRepository.save(message);
    }

    public MessageReactionEntity addReaction(Long messageId, Long userId, String emoji) {
        ChatMessageEntity message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        UserEntity user = message.getSender();

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
    }

    private void awardPoints(PlayerSessionEntity player, int points, String reason) {
        ScoreRecordEntity record = new ScoreRecordEntity();
        record.setSession(player.getSession());
        record.setUser(player.getUser());
        record.setPoints(points);
        record.setReason(reason);
        record.setTimestamp(new Date());

        player.getUser().getScoreRecords().add(record);
        player.getSession().getScores().add(record);

        scoreRecordRepository.save(record);
        player.setTotalScore(player.getTotalScore() + points);
    }

    public List<ChatMessageEntity> getSessionMessages(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
}