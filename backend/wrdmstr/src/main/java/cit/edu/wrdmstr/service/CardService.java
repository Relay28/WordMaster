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

                // Mark card as used
                playerCard.setUsed(true);
                playerCardRepository.save(playerCard);

                result.put("success", true);
                result.put("message", "Card used successfully!");
                result.put("pointsAwarded", card.getPointsBonus());
                result.put("cardName", card.getName());
                result.put("newTotalScore", player.getTotalScore());

                logger.info("Player {} used card {} successfully, gained {} points",
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
    public boolean useCard(Long playerCardId, String message) {
        Map<String, Object> result = useCardWithMessage(playerCardId, message);
        return (Boolean) result.getOrDefault("success", false);
    }

    private boolean checkCardCondition(PowerupCard card, String message) {
        String condition = card.getTriggerCondition();
        
        // Normalize the message: convert to lowercase and trim spaces
        String normalizedMessage = message.toLowerCase().trim();

        switch (condition) {
            case "USE_ADJECTIVE":
                // More generous adjective detection
                return containsPartOfSpeech(normalizedMessage, "ADJECTIVE") ||
                       // Common adjective suffixes
                       normalizedMessage.matches(".*(ful|ous|ish|able|ible|al|ent|ive|less|y|ian|en|ese|ic|ical|ly|ed)\\b.*");

            case "USE_NOUN":
                // More generous noun detection
                return containsPartOfSpeech(normalizedMessage, "NOUN") ||
                       // Check for capitalized words (proper nouns) and common noun patterns
                       normalizedMessage.matches(".*\\b[A-Z][a-z]+\\b.*") ||
                       normalizedMessage.matches(".*(ness|ship|ment|ity|ance|ence|sion|tion|hood|dom|ism|ist|er|or|ian)\\b.*");

            case "LONG_SENTENCE":
                // Relaxed length constraint - characters instead of words
                return normalizedMessage.length() > 30;

            case "COMPLEX_SENTENCE":
                // More generous detection of complex sentences
                return normalizedMessage.split("[,;.]").length > 1 ||
                       normalizedMessage.matches(".*(because|since|although|though|while|if|when|after|before|as|so|that|which|who|whom|whose|where|how|why).*");

            default:
                logger.warn("Unknown card condition: {}", condition);
                return true; // Default to success for unknown conditions
        }
    }

    // This would use an NLP service to check parts of speech
    private boolean containsPartOfSpeech(String message, String posTag) {
        // Expanded wordlists for better detection
        if (posTag.equals("ADJECTIVE")) {
            return message.matches(".*\\b(amazing|great|big|small|happy|good|bad|beautiful|ugly|smart|clever|important|difficult|easy|hard|soft|hot|cold|new|old|young|tall|short|high|low|fast|slow|early|late|strong|weak|rich|poor|clean|dirty|bright|dark|loud|quiet|sweet|sour|bitter|salty|rough|smooth|thick|thin|heavy|light|wide|narrow|deep|shallow|sharp|blunt|dry|wet|fresh|stale|safe|dangerous|healthy|sick|wild|tame|raw|cooked|empty|full|free|busy|open|closed|public|private|different|same|right|wrong|left|correct|interesting|boring|funny|serious|strange|normal|possible|impossible|necessary|useful|useless|valuable|cheap|expensive|popular|common|rare|lucky|real|fake|true|false|best|worst|special|usual|favorite|friendly)\\b.*");
        } else if (posTag.equals("NOUN")) {
            return message.matches(".*\\b(man|woman|child|boy|girl|person|dog|cat|house|car|school|book|tree|water|food|phone|computer|teacher|student|friend|city|country|world|day|night|time|year|way|thing|life|family|home|work|job|money|business|problem|idea|information|power|love|health|name|place|room|area|history|story|fact|paper|group|number|game|party|news|music|people|art|science|nature|animal|movie|show|video|picture|program|system|company|office|service|store|market|case|community|service|language|knowledge|quality|education|experience|government|organization|society|example|property|religion|member|energy|team|relationship|adventure|moment|hour|minute|second|month|week|weekend|morning|afternoon|evening|night|floor|wall|door|window|road|street|road|building|town|area|field|garden|park|mountain|river|lake|ocean|sea|beach|airport|station|hotel|restaurant|mall|shop|store|product|customer|price|machine|device|tool|part|project|material|plant|virus)\\b.*");
        }
        return false;
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

    // Helper method to give users more specific hints
    private String getHintForCard(String triggerCondition) {
        switch (triggerCondition) {
            case "USE_ADJECTIVE":
                return "a descriptive word like 'beautiful', 'great', 'interesting', etc.";
            case "USE_NOUN":
                return "a person, place or thing like 'teacher', 'school', 'book', etc.";
            case "LONG_SENTENCE":
                return "a longer sentence with more words (at least 30 characters)";
            case "COMPLEX_SENTENCE":
                return "a sentence with multiple parts or connecting words like 'because', 'when', 'if', etc.";
            default:
                return "the right keywords for this card";
        }
    }
}