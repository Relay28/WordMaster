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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final Random random = new Random();
    // File: src/main/java/cit/edu/wrdmstr/service/CardService.java
    @Transactional
    public void drawCardsForPlayer(Long playerId) {
        PlayerSessionEntity player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        logger.info("Attempting to draw cards for player {}. Cards drawn status: {}", playerId, player.isCardsDrawn());

        if (player.isCardsDrawn()) {
            logger.info("Player {} already has cards drawn. Skipping card assignment.", playerId);
            return;
        }

        List<PowerupCard> availableCards = cardRepository.findByContentData(
                player.getSession().getContent().getContentData()
        );

        if (availableCards.isEmpty()) {
            logger.warn("No cards available for content {}. Cannot assign cards to player {}.",
                    player.getSession().getContent().getId(), playerId);
            return;
        }

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

        logger.info("Successfully drew {} cards for player {}.", playerCards.size(), playerId);
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
        // In CardService.generateCardsForContent method


    // Grammar-focused cards
            newCards.add(createCard(content, "USE_PAST_TENSE", "Use a verb in past tense form", 15));
            newCards.add(createCard(content, "USE_PRESENT_PERFECT", "Use present perfect tense (have/has + verb)", 20));
            newCards.add(createCard(content, "USE_CONJUNCTION", "Use a conjunction (and, but, or, because)", 10));

    // Vocabulary expansion cards

            newCards.add(createCard(content, "USE_ACADEMIC_WORD", "Use an academic vocabulary word", 25));
            newCards.add(createCard(content, "USE_PHRASAL_VERB", "Use a phrasal verb (e.g., 'give up', 'look after')", 20));

    // Communication skills cards
            newCards.add(createCard(content, "ASK_QUESTION", "Form a proper question", 15));
            newCards.add(createCard(content, "EXPRESS_OPINION", "Express your opinion using 'I think' or 'In my opinion'", 15));
            newCards.add(createCard(content, "POLITE_RESPONSE", "Give a polite response using courtesy words", 10));

    // Advanced cards
            newCards.add(createCard(content, "USE_CONDITIONALS", "Use an if-clause in your sentence", 25));
            newCards.add(createCard(content, "REPORTED_SPEECH", "Use reported speech to relay information", 30));
            newCards.add(createCard(content, "ACTIVE_PASSIVE", "Transform a sentence from active to passive voice", 25));
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
        try {
            List<PlayerCard> cards = playerCardRepository.findByPlayerSessionId(playerId);

            return cards.stream()
                    .filter(card -> !card.isUsed())
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching cards for player {}: {}", playerId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<PlayerCardDTO> getPlayerCardsByUserId(Long sessionId, Long userId) {
        try {
            PlayerSessionEntity player = playerRepository.findBySessionIdAndUserId(sessionId, userId)
                    .stream()
                    .filter(PlayerSessionEntity::isActive)
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Active player session not found"));

            return getPlayerCards(player.getId());
        } catch (Exception e) {
            logger.error("Error fetching cards for user {} in session {}: {}", userId, sessionId, e.getMessage());
            return new ArrayList<>();
        }
    }
    @Transactional
    public Map<String, Object> useCardWithMessage(Long playerCardId, String message) {
        Map<String, Object> result = new HashMap<>();

        try {
            PlayerCard playerCard = playerCardRepository.findById(playerCardId)
                    .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

            if (playerCard.isUsed()) {
                result.put("success", false);
                result.put("message", "Card has already been used");
                return result;
            }

            PowerupCard card = playerCard.getCard();
            boolean conditionMet = checkCardCondition(card, message);

            logger.info("Card condition check for card {} with message '{}': {}",
                    card.getTriggerCondition(), message, conditionMet ? "PASSED" : "FAILED");

            if (conditionMet) {
                // Award points
                PlayerSessionEntity player = playerCard.getPlayerSession();
                int oldScore = player.getTotalScore();
                player.setTotalScore(oldScore + card.getPointsBonus());
                playerRepository.save(player);

                // Mark old card as used
                playerCard.setUsed(true);
                playerCardRepository.save(playerCard);

                // Draw a replacement card
                PlayerCard replacementCard = drawReplacementCard(player);

                result.put("success", true);
                result.put("message", "Card used successfully!");
                result.put("pointsAwarded", card.getPointsBonus());
                result.put("cardName", card.getName());
                result.put("newTotalScore", player.getTotalScore());

                // Add replacement card info
                if (replacementCard != null) {
                    result.put("replacementCard", convertToDTO(replacementCard));
                }

                logger.info("Player {} used card {} successfully, gained {} points, received replacement card",
                        player.getId(), card.getName(), card.getPointsBonus());
            } else {
                result.put("success", false);
                result.put("message", "Card conditions not met for " + card.getName() + ". Try using " + getHintForCard(card.getTriggerCondition()));
                result.put("cardName", card.getName());
                result.put("requirement", card.getDescription());
            }

        } catch (Exception e) {
            logger.error("Error using card {}: {}", playerCardId, e.getMessage());
            result.put("success", false);
            result.put("message", "Error processing card: " + e.getMessage());
        }

        return result;
    }

    @Transactional
    private PlayerCard drawReplacementCard(PlayerSessionEntity player) {
        try {
            List<PowerupCard> availableCards = cardRepository.findByContentData(
                    player.getSession().getContent().getContentData()
            );

            if (!availableCards.isEmpty()) {
                PowerupCard newCard = availableCards.get(random.nextInt(availableCards.size()));

                PlayerCard replacementCard = new PlayerCard();
                replacementCard.setPlayerSession(player);
                replacementCard.setCard(newCard);
                replacementCard.setUsed(false);

                return playerCardRepository.save(replacementCard);
            }
        } catch (Exception e) {
            logger.error("Failed to draw replacement card for player {}: {}", player.getId(), e.getMessage());
        }
        return null;
    }

    @Transactional
    public boolean useCard(Long playerCardId, String message) {
        Map<String, Object> result = useCardWithMessage(playerCardId, message);
        return (Boolean) result.getOrDefault("success", false);
    }

    private boolean checkCardCondition(PowerupCard card, String message) {
        String condition = card.getTriggerCondition();
        String normalizedMessage = message.toLowerCase().trim();

        switch (condition) {
            case "USE_PAST_TENSE":
                return message.matches(".*\\b(ed|was|were|had|did|went|came|saw|made|took|got|said|found|thought|told|became|left|felt|put|brought|began|kept|held|wrote|stood|heard|let|meant|set|met|ran|paid|sat|spoke|lay|led|read|grew|lost|fell|sent|built)\\b.*");

            case "USE_PRESENT_PERFECT":
                return message.matches(".*(have|has)\\s+(\\w+ed|been|had|done|made|gone|taken|seen|come|known|given|found|thought|told|become|left|felt|put|brought|begun|kept|held|written|stood|heard|let|meant|set|met|run|paid|sat|spoken|lain|led|read|grown|lost|fallen|sent|built)\\b.*");

            case "USE_CONJUNCTION":
                return message.matches(".*\\b(and|but|or|nor|for|yet|so|because|although|since|unless|while|where|if|before|after|as|when|though|whether|even though|in case|provided that|assuming that)\\b.*");


            case "USE_ACADEMIC_WORD":
                return message.matches(".*\\b(analyze|evaluate|conclude|demonstrate|establish|indicate|interpret|investigate|obtain|participate|process|require|similar|significant|specific|theory|achieve|acquire|affect|approach|concept|context|data|define|environment|factor|function|identify|method|proceed|research|respond|strategy|structure|valid)\\b.*");

            case "USE_PHRASAL_VERB":
                return message.matches(".*\\b(give up|look after|take off|get along|bring up|come across|figure out|look forward|put off|turn down|carry on|come back|find out|get over|go through|make up|pick up|point out|set up|take care|think about|work out|break down|bring about|catch up|check out|come up|get away|hold on|look into|put on|run into|take over|turn out)\\b.*");

            case "ASK_QUESTION":
                return message.matches("^(what|who|where|when|why|how|is|are|was|were|do|does|did|have|has|had|can|could|will|would|should|may|might)\\b.*\\?$");

            case "EXPRESS_OPINION":
                return message.matches(".*(i think|in my opinion|i believe|i feel|from my perspective|in my view|as i see it|to my mind|if you ask me|personally|in my experience).*");

            case "POLITE_RESPONSE":
                return message.matches(".*(please|thank you|thanks|excuse me|pardon|sorry|would you|could you|may i|appreciate|grateful|kind|pleasure|welcome).*");

            case "USE_CONDITIONALS":
                return message.matches(".*(if|unless|provided that|assuming that|as long as|in case).*");

            case "REPORTED_SPEECH":
                return message.matches(".*(said that|told that|mentioned that|reported that|announced that|claimed that|suggested that|explained that|stated that|declared that).*");

            case "ACTIVE_PASSIVE":
                return message.matches(".*(is|are|was|were|been|being|be)\\s+(\\w+ed|done|made|given|taken|seen|found|brought|sent|built|written|spoken|known)\\s+by\\b.*");

            default:
                logger.warn("Unknown card condition: {}", condition);
                return false;
        }
    }

    private PlayerCardDTO convertToDTO(PlayerCard card) {
        PlayerCardDTO dto = new PlayerCardDTO();
        dto.setId(card.getId());
        dto.setCardId(card.getCard().getId());
        dto.setName(card.getCard().getName());
        dto.setDescription(card.getCard().getDescription());
        dto.setPointsBonus(card.getCard().getPointsBonus());
        dto.setUsed(card.isUsed());
        dto.setActivated(card.isActivated()); // Include the activated field
        return dto;
    }

    // Helper method to give users more specific hints
    private String getHintForCard(String triggerCondition) {
        switch (triggerCondition) {
            case "USE_PAST_TENSE":
                return "a verb in past tense like 'walked', 'played', 'went', 'saw', etc.";

            case "USE_PRESENT_PERFECT":
                return "a phrase using 'have' or 'has' with a past participle like 'have seen', 'has gone', etc.";

            case "USE_CONJUNCTION":
                return "connecting words like 'and', 'but', 'because', 'although', etc.";

            case "USE_SYNONYM":
                return "different words with similar meanings like 'big/large', 'happy/joyful', etc.";

            case "USE_ACADEMIC_WORD":
                return "formal words like 'analyze', 'evaluate', 'demonstrate', 'investigate', etc.";

            case "USE_PHRASAL_VERB":
                return "verb combinations like 'give up', 'look after', 'take off', etc.";

            case "ASK_QUESTION":
                return "a sentence starting with 'what', 'who', 'where', 'when', 'why', 'how' and ending with '?'";

            case "EXPRESS_OPINION":
                return "phrases like 'I think', 'in my opinion', 'I believe', etc.";

            case "POLITE_RESPONSE":
                return "polite words like 'please', 'thank you', 'excuse me', etc.";

            case "USE_CONDITIONALS":
                return "a sentence using 'if', 'unless', or 'as long as'";

            case "REPORTED_SPEECH":
                return "reporting what someone said using 'said that', 'told that', etc.";

            case "ACTIVE_PASSIVE":
                return "a sentence in passive form like 'was done by', 'is made by', etc.";

            default:
                return "the right keywords for this card";
        }
    }
}