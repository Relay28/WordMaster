package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.PlayerCardDTO;
import cit.edu.wrdmstr.entity.ContentEntity;
import cit.edu.wrdmstr.entity.PlayerCard;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.entity.PowerupCard;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.PlayerCardRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.PowerupCardRepository;
import cit.edu.wrdmstr.service.gameplay.GameSessionManagerService;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(CardService.class);
    @Autowired private PlayerCardRepository playerCardRepository;
    @Autowired private PlayerSessionEntityRepository playerRepository;

    @Autowired
    private ContentRepository contentRepository;
  private final Random random =new Random();

    @Transactional
    public void drawCardsForPlayer(Long playerId) {
        PlayerSessionEntity player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        if (player.isCardsDrawn()) {
            logger.info("Player {} already has cards drawn", playerId);
            return;
        }

        // Get available cards for the content
        List<PowerupCard> availableCards = cardRepository.findByContentData(
                player.getSession().getContent().getContentData()
        );

        if (availableCards.isEmpty()) {
            logger.warn("No cards available for content {}",
                    player.getSession().getContent().getId());
            return;
        }

        // Draw 3 random cards for the player
        Random random = new Random();
        List<PlayerCard> playerCards = new ArrayList<>();

        for (int i = 0; i < 3; i++) {
            PowerupCard card = availableCards.get(random.nextInt(availableCards.size()));

            PlayerCard playerCard = new PlayerCard();
            playerCard.setPlayerSession(player);
            playerCard.setCard(card);
            playerCard.setUsed(false);

            playerCards.add(playerCardRepository.save(playerCard));
        }

        player.setCardsDrawn(true);
        playerRepository.save(player);

        logger.info("Drew {} cards for player {}", playerCards.size(), playerId);
    }


    // File: src/main/java/cit/edu/wrdmstr/service/CardService.java
    @Transactional
    public void generateCardsForContent(Long contentId) {
        ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));

        // Check if cards already exist for this content
        List<PowerupCard> existingCards = cardRepository.findByContentData(content.getContentData());
        if (!existingCards.isEmpty()) {
            logger.info("Cards already exist for content {}. Skipping generation.", contentId);
            return;
        }

        // Generate new cards based on content data
        List<PowerupCard> newCards = new ArrayList<>();
        newCards.add(createCard(content, "USE_ADJECTIVE", "Use an adjective in your sentence", 10));
        newCards.add(createCard(content, "USE_NOUN", "Use a noun in your sentence", 10));
        newCards.add(createCard(content, "LONG_SENTENCE", "Write a sentence longer than 50 characters", 15));
        newCards.add(createCard(content, "COMPLEX_SENTENCE", "Write a complex sentence with multiple clauses", 20));

        // Save the generated cards
        for (PowerupCard card : newCards) {
            cardRepository.save(card);
        }

        logger.info("Generated {} cards for content {}", newCards.size(), contentId);
    }

    private PowerupCard createCard(ContentEntity content, String triggerCondition, String description, int pointsBonus) {
        PowerupCard card = new PowerupCard();
        card.setContentData(content.getContentData());
        card.setTriggerCondition(triggerCondition);
        card.setDescription(description);
        card.setPointsBonus(pointsBonus);
        card.setName("Powerup: " + triggerCondition);
        card.setRarity("COMMON"); // Set default rarity

        try {
            return cardRepository.save(card);
        } catch (Exception e) {
            logger.error("Failed to create powerup card: {}", e.getMessage());
            throw new RuntimeException("Failed to create powerup card", e);
        }
    }

    public List<PlayerCardDTO> getPlayerCards(Long playerId) {
        List<PlayerCard> cards = playerCardRepository.findByPlayerSessionId(playerId);

        return cards.stream()
                .filter(card -> !card.isUsed())
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