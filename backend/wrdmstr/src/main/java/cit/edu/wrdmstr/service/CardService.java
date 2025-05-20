package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.PlayerCardDTO;
import cit.edu.wrdmstr.entity.PlayerCard;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.entity.PowerupCard;
import cit.edu.wrdmstr.repository.PlayerCardRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.PowerupCardRepository;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class CardService {
    @Autowired
    private PowerupCardRepository cardRepository;
    @Autowired private PlayerCardRepository playerCardRepository;
    @Autowired private PlayerSessionEntityRepository playerRepository;

  private final Random random =new Random();

    @Transactional
    public void drawCardsForPlayer(Long playerSessionId) {
        PlayerSessionEntity player = playerRepository.findById(playerSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found"));

        if (player.isCardsDrawn()) {
            return; // Already drew cards
        }

        // Get all available cards for this content
        List<PowerupCard> allCards = cardRepository.findByContentData(
                player.getSession().getContent().getContentData());

        if (allCards.isEmpty()) {
            return; // No cards configured for this content
        }

        // Draw 4 random cards
        List<PowerupCard> drawnCards = new ArrayList<>();
        while (drawnCards.size() < 4 && !allCards.isEmpty()) {
            PowerupCard card = allCards.get(random.nextInt(allCards.size()));
            if (!drawnCards.contains(card)) {
                drawnCards.add(card);
            }
        }

        // Assign to player
        for (PowerupCard card : drawnCards) {
            PlayerCard playerCard = new PlayerCard();
            playerCard.setPlayerSession(player);
            playerCard.setCard(card);
            playerCard.setUsed(false);
            playerCardRepository.save(playerCard);
        }

        player.setCardsDrawn(true);
        playerRepository.save(player);
    }

    public List<PlayerCardDTO> getPlayerCards(Long playerSessionId) {
        return playerCardRepository.findByPlayerSessionId(playerSessionId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean useCard(Long playerCardId, String message) {
        PlayerCard playerCard = playerCardRepository.findById(playerCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (playerCard.isUsed()) {
            return false; // Card already used
        }

        // Check if the message meets the card's condition
        if (checkCardCondition(playerCard.getCard(), message)) {
            // Award points
            PlayerSessionEntity player = playerCard.getPlayerSession();
            player.setTotalScore(player.getTotalScore() + playerCard.getCard().getPointsBonus());
            playerRepository.save(player);

            // Mark card as used
            playerCard.setUsed(true);
            playerCardRepository.save(playerCard);

            return true;
        }

        return false;
    }

    private boolean checkCardCondition(PowerupCard card, String message) {
        switch (card.getTriggerCondition()) {
            case "USE_ADJECTIVE":
                return containsPartOfSpeech(message, "JJ"); // JJ is adjective tag in POS tagging
            case "USE_NOUN":
                return containsPartOfSpeech(message, "NN");
            case "LONG_SENTENCE":
                return message.length() > 50;
            case "COMPLEX_SENTENCE":
                return message.split("[.!?]").length > 1;
            default:
                return false;
        }
    }

    // This would use an NLP service to check parts of speech
    private boolean containsPartOfSpeech(String message, String posTag) {
        // Implement with your NLP service or a simple regex for basic cases
        // For a real implementation, you'd want to use a proper NLP library
        return message.matches(".*\\b(amazing|great|big|small|happy)\\b.*"); // Simple example
    }

    private PlayerCardDTO convertToDTO(PlayerCard card) {
        PlayerCardDTO dto = new PlayerCardDTO();
        dto.setId(card.getId());
        dto.setCardId(card.getCard().getId());
        dto.setName(card.getCard().getName());
        dto.setDescription(card.getCard().getDescription());
        dto.setPointsBonus(card.getCard().getPointsBonus());
        dto.setUsed(card.isUsed());
        return dto;
    }
}