package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.GameStateDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import cit.edu.wrdmstr.dto.TurnInfoDTO;
import cit.edu.wrdmstr.dto.WordBankItemDTO;
import cit.edu.wrdmstr.dto.WordSubmissionDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.CardService;
import cit.edu.wrdmstr.service.ProgressTrackingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameSessionManagerService {
    private static final Logger logger = LoggerFactory.getLogger(GameSessionManagerService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final GameSessionEntityRepository gameSessionRepository;
    private final PlayerSessionEntityRepository playerRepository;
    private final WordBankItemRepository wordBankRepository;
    private final RoleRepository roleRepository;
    private final ScoreRecordEntityRepository scoreRepository;
    private final ChatService chatService;
    private final GameSessionService gameSessionService;
    private final UserRepository userRepository;

    @Autowired private CardService cardService;
    private final GrammarCheckerService grammarCheckerService;
    private final AIService aiService;
    @Autowired private ScoreService scoreService;
  private final StudentProgressRepository progressRepository;
    // In-memory game state tracking

    @Autowired
    private ProgressTrackingService progressTrackingService;
    private final Map<Long, GameState> activeGames = new ConcurrentHashMap<>();

    @Autowired
    public GameSessionManagerService(
            SimpMessagingTemplate messagingTemplate,
            GameSessionEntityRepository gameSessionRepository,
            PlayerSessionEntityRepository playerRepository,
            WordBankItemRepository wordBankRepository,
            RoleRepository roleRepository,
            ScoreRecordEntityRepository scoreRepository,
            ChatService chatService,
            GrammarCheckerService grammarCheckerService,
            GameSessionService gameSessionService,
            AIService aiService,
            UserRepository userRepository, StudentProgressRepository progressRepository) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.gameSessionRepository = gameSessionRepository;
        this.playerRepository = playerRepository;
        this.wordBankRepository = wordBankRepository;
        this.roleRepository = roleRepository;
        this.scoreRepository = scoreRepository;
        this.chatService = chatService;
        this.grammarCheckerService = grammarCheckerService;
        this.gameSessionService = gameSessionService;
        this.aiService = aiService;
        this.progressRepository = progressRepository;
    }

    @Transactional
    public void startGame(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));

        if (session.getStatus() == GameSessionEntity.SessionStatus.ACTIVE) {
            throw new IllegalStateException("Game is already active");
        }

        session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
        session.setStartedAt(new Date());
        // session is saved after initialization

        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId); // Use playerRepository
        if (players.isEmpty()) {
            throw new IllegalStateException("Cannot start a game with no players");
        }

        GameState gameState = new GameState();
        gameState.setSessionId(sessionId);
        gameState.setPlayers(players); // Keep this for in-memory state if needed
        gameState.setStatus(GameState.Status.WAITING_FOR_PLAYER); // Initial status
        gameState.setTurnStartTime(new Date());
        if (session.getContent() != null && session.getContent().getContentData() != null) {
            gameState.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
        }
        gameState.setUsedWords(new ArrayList<>());
        
        // Content Info
        Map<String, Object> contentInfo = new HashMap<>();
        if (session.getContent() != null) {
            contentInfo.put("id", session.getContent().getId());
            contentInfo.put("title", session.getContent().getTitle());
            contentInfo.put("description", session.getContent().getDescription());
        }
        gameState.setContentInfo(contentInfo);

        // Initialize game settings (this will set turns and cycles)
        initializeGame(session, gameState, players); // Pass gameState and players
        
        gameSessionRepository.save(session); // Save session after all modifications
        activeGames.put(sessionId, gameState);

        // Cards (if applicable)
        // for (PlayerSessionEntity player : players) {
        //     cardService.drawCardsForPlayer(player.getId());
        // }

        // Broadcast game started
        Map<String, Object> startedMessage = new HashMap<>();
        startedMessage.put("event", "gameStarted");
        startedMessage.put("sessionId", sessionId);
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", startedMessage);

        // Broadcast first turn
        startNextTurn(sessionId);
    }

    private void trackTurnCompletion(PlayerSessionEntity player, GameSessionEntity session) {
        try {
            long turnEndTime = System.currentTimeMillis();
            GameState gameState = activeGames.get(session.getId());

            if (gameState != null) {
                // Calculate response time
                long turnStartTime = gameState.getLastTurnTime();
                double responseTime = (turnEndTime - turnStartTime) / 1000.0;

                // Get or create progress record
                StudentProgress progress = progressTrackingService.getStudentProgress(
                        player.getUser().getId(), session.getId());

                // Update turn counts and response time
                progress.setTotalTurnsTaken(progress.getTotalTurnsTaken() + 1);
                progress.setTotalResponseTime(progress.getTotalResponseTime() + responseTime);

                // Calculate metrics
                double turnCompletionRate = calculateTurnCompletionRate(progress, session);
                double avgResponseTime = progress.getTotalTurnsTaken() > 0 ?
                        progress.getTotalResponseTime() / progress.getTotalTurnsTaken() : 0;

                // Update progress
                progress.setTurnCompletionRate(turnCompletionRate);
                progress.setAvgResponseTime(avgResponseTime);

                progressRepository.save(progress);

                // Track all metrics
                progressTrackingService.trackTurnProgress(session.getId(), player.getId());
            }
        } catch (Exception e) {
            logger.error("Error tracking turn completion for player {}: {}",
                    player.getId(), e.getMessage());
        }
    }

    private void initializeGame(GameSessionEntity session, GameState gameState, List<PlayerSessionEntity> players) {
        GameConfig gameConfig = session.getContent().getGameConfig();
        if (gameConfig == null) {
            throw new IllegalStateException("Game configuration not found for content: " + session.getContent().getId());
        }

        int configuredTurnCycles = gameConfig.getTurnCycles() != null ? gameConfig.getTurnCycles() : 1; // Default to 1 cycle if null

        int totalTurns;
        boolean isSinglePlayer = players.size() == 1;

        if (isSinglePlayer) {
            totalTurns = configuredTurnCycles; // For single-player, turnCycles means total turns
        } else {
            totalTurns = configuredTurnCycles * players.size(); // Each player takes a turn in each cycle
        }

        session.setTotalTurns(totalTurns);
        session.setCurrentTurn(1);
        session.setCurrentCycle(1);
        session.setTimePerTurn(gameConfig.getTimePerTurn() != null ? gameConfig.getTimePerTurn() : 60);

        gameState.setTotalTurns(totalTurns);
        gameState.setCurrentTurn(1);
        gameState.setCurrentCycle(1);
        gameState.setTimePerTurn(session.getTimePerTurn());
        gameState.setConfiguredTurnCycles(configuredTurnCycles); // Store configured cycles

        logger.info("Game Initialized for session {}: SinglePlayer={}, TotalTurns={}, CurrentTurn=1, CurrentCycle=1, ConfiguredCycles={}",
            session.getId(), isSinglePlayer, totalTurns, configuredTurnCycles);

        // Assign roles if they exist
        List<Role> roles = roleRepository.findByContentDataContentId(session.getContent().getId());
        if (!roles.isEmpty()) {
            assignRoles(players, roles); // Ensure players are persisted before role assignment if roles depend on player IDs
        }

        // Select the first player
        if (!players.isEmpty()) {
            selectNextPlayer(session); // This will set session.currentPlayer
            if (session.getCurrentPlayer() != null) {
                gameState.setCurrentPlayerId(session.getCurrentPlayer().getId());
            }
        }
        
        // Generate and send initial story prompt
        String initialStoryElement = generateStoryElement(session, 1);
        Map<String, Object> storyUpdate = new HashMap<>();
        storyUpdate.put("type", "storyUpdate");
        storyUpdate.put("content", initialStoryElement);
        gameState.setStoryPrompt(initialStoryElement); // Also set in-memory GameState
        
        messagingTemplate.convertAndSend("/topic/game/" + session.getId() + "/updates", storyUpdate);
        
        resetTurnTimer(session); // Reset timer for the first turn
    }

    // RESTORE THIS METHOD: Add back the role assignment method
    private void assignRoles(List<PlayerSessionEntity> players, List<Role> roles) {
        Random random = new Random();
        int numRoles = roles.size();
        
        logger.info("Starting role assignment: {} roles for {} players", numRoles, players.size());
        // Log role information for debugging
        for (Role role : roles) {
            logger.info("Available role: ID={}, Name={}", role.getId(), role.getName());
        }
        
        // Shuffle roles for better distribution
        List<Role> shuffledRoles = new ArrayList<>(roles);
        Collections.shuffle(shuffledRoles);
        
        for (int i = 0; i < players.size(); i++) {
            PlayerSessionEntity player = players.get(i);
            Role role = shuffledRoles.get(i % numRoles);
            
            logger.info("Assigning role '{}' (ID: {}) to player: {} {}",
                        role.getName(), role.getId(),
                        player.getUser().getFname(), 
                        player.getUser().getLname());
            
            // Explicitly set the role relationship on both sides
            player.setRole(role);
            
            // Save the player with the new role assignment
            PlayerSessionEntity savedPlayer = playerRepository.save(player);
            
            // Verify the assignment took effect
            logger.info("After save - Player ID: {}, Role: {}", 
                        savedPlayer.getId(), 
                        savedPlayer.getRole() != null ? savedPlayer.getRole().getName() : "null");
        }
        
        // After all players have been assigned roles, fetch them from the database to confirm
        logger.info("Verifying all player role assignments:");
        for (PlayerSessionEntity player : playerRepository.findBySessionId(players.get(0).getSession().getId())) {
            logger.info("Player: {} {}, Role: {}", 
                       player.getUser().getFname(),
                       player.getUser().getLname(),
                       player.getRole() != null ? player.getRole().getName() : "null");
        }
    }
    
    private void selectNextPlayer(GameSessionEntity session) {
        List<PlayerSessionEntity> players = playerRepository.findBySessionId(session.getId()); // Consistent order
        
        if (players.isEmpty()) {
            logger.warn("No players in session {} to select next player from.", session.getId());
            session.setCurrentPlayer(null);
            return;
        }
        
        PlayerSessionEntity currentDBPlayer = session.getCurrentPlayer();
        int currentIndex = -1;
        if (currentDBPlayer != null) {
            for (int i = 0; i < players.size(); i++) {
                if (players.get(i).getId().equals(currentDBPlayer.getId())) {
                    currentIndex = i;
                    break;
                }
            }
        }
        
        int nextIndex = (currentIndex + 1) % players.size();
        session.setCurrentPlayer(players.get(nextIndex));
        
        GameState gameState = activeGames.get(session.getId());
        if (gameState != null) {
            gameState.setCurrentPlayerId(players.get(nextIndex).getId());
        }
        logger.info("Next player selected for session {}: Player ID {}", session.getId(), players.get(nextIndex).getId());
    }
    
    private void resetTurnTimer(GameSessionEntity session) {
        GameState gameState = activeGames.get(session.getId());
        if (gameState != null) {
            gameState.setTurnStartTime(new Date()); // For calculating time taken if needed
            gameState.setLastTurnTime(System.currentTimeMillis()); // For countdown timer
            
            // Sync GameState with SessionEntity state
            gameState.setCurrentTurn(session.getCurrentTurn());
            gameState.setTotalTurns(session.getTotalTurns());
            gameState.setTimePerTurn(session.getTimePerTurn());
            gameState.setCurrentCycle(session.getCurrentCycle());
            if (session.getCurrentPlayer() != null) {
                gameState.setCurrentPlayerId(session.getCurrentPlayer().getId());
            }
        }
    }
    
    // Add this broadcastGameState method
    private void broadcastGameState(GameSessionEntity session) {
        GameStateDTO gameStateDTO = getGameState(session.getId()); // Use the existing getGameState
        messagingTemplate.convertAndSend("/topic/game/" + session.getId() + "/state", gameStateDTO);
    }


    // Replace the existing generateStoryElement method with this improved version
    @Transactional(propagation = Propagation.REQUIRED)
    private String generateStoryElement(GameSessionEntity session, int turnNumber) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("task", "story_prompt");
            request.put("content", session.getContent().getDescription());
            request.put("turn", turnNumber);
            
            GameState gameState = activeGames.get(session.getId());
            if (gameState != null && gameState.getUsedWords() != null && !gameState.getUsedWords().isEmpty()) {
                request.put("usedWords", gameState.getUsedWords());
            } else {
                request.put("usedWords", Collections.emptyList());
            }
            
            return aiService.callAIModel(request).getResult();
        } catch (Exception e) {
            logger.error("Error generating story element for session {}: {}", session.getId(), e.getMessage(), e);
            return "Continue the conversation based on your role!"; // Fallback
        }
    }
    
    private void assignWordBombs(List<PlayerSessionEntity> players, List<WordBankItem> wordBank) {
        Random random = new Random();
        
        for (PlayerSessionEntity player : players) {
            String word = wordBank.get(random.nextInt(wordBank.size())).getWord();
            player.setCurrentWordBomb(word);
            player.setWordBombUsed(false);
            playerRepository.save(player);
        }
    }
    
    @Transactional(propagation = Propagation.REQUIRED)
    public void startNextTurn(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Game session not found for starting next turn: " + sessionId));
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            logger.error("GameState not found for active session {}", sessionId);
            // Potentially re-initialize or end game
            return;
        }

        // selectNextPlayer has already been called during initializeGame or advanceToNextPlayer
        // session.getCurrentPlayer() should be set.

        PlayerSessionEntity currentPlayer = session.getCurrentPlayer();
        if (currentPlayer == null) {
            logger.error("Current player is null for session {} at turn {}. Ending game.", sessionId, gameState.getCurrentTurn());
            endGame(sessionId); // Or handle error appropriately
            return;
        }

        gameState.setStatus(GameState.Status.TURN_IN_PROGRESS);
        resetTurnTimer(session); // Resets timer and syncs GameState turn/cycle numbers

        // Generate story prompt for the new turn (if not the very first turn handled by initializeGame)
        if (gameState.getCurrentTurn() > 1 || gameState.getStoryPrompt() == null) {
             String storyElement = generateStoryElement(session, gameState.getCurrentTurn());
             gameState.setStoryPrompt(storyElement);
             Map<String, Object> storyUpdate = new HashMap<>();
             storyUpdate.put("type", "storyUpdate");
             storyUpdate.put("content", storyElement);
             messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", storyUpdate);
        }

        TurnInfoDTO turnInfo = new TurnInfoDTO();
        turnInfo.setTurnNumber(gameState.getCurrentTurn());
        turnInfo.setPlayerId(currentPlayer.getId());
        turnInfo.setPlayerName(currentPlayer.getUser().getFname() + " " + currentPlayer.getUser().getLname());
        turnInfo.setTimeRemaining(gameState.getTimePerTurn());
        if (currentPlayer.getRole() != null) {
            turnInfo.setRoleName(currentPlayer.getRole().getName());
        }
        // turnInfo.setWordBomb(currentPlayer.getCurrentWordBomb()); // If using word bombs

        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/turn", turnInfo);
        logger.info("Turn {} started for player {} in session {}", gameState.getCurrentTurn(), currentPlayer.getId(), sessionId);
    }

    @Transactional
    public boolean submitWord(Long sessionId, Long userId, WordSubmissionDTO submission) {
        logger.info("Attempting to submit word for session {} by user {}: {}", sessionId, userId, submission.getWord());

        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            logger.warn("Submit word failed - no active game state found for session {}", sessionId);
            return false;
        }

        if (gameState.getStatus() != GameState.Status.TURN_IN_PROGRESS) {
            logger.warn("Submit word failed - game is not in progress (current status: {}) for session {}",
                    gameState.getStatus(), sessionId);
            return false;
        }

        // Verify it's the user's turn
        PlayerSessionEntity currentPlayer = playerRepository.findById(gameState.getCurrentPlayerId())
                .orElseThrow(() -> {
                    logger.error("Current player not found for game state with player ID {}",
                            gameState.getCurrentPlayerId());
                    return new RuntimeException("Current player not found");
                });

        if (!(currentPlayer.getUser().getId() ==(userId))) {
            logger.warn("Submit word failed - it's not user {}'s turn (current player: {})",
                    userId, currentPlayer.getUser().getId());
            return false;
        }

        // Input validation - at least 5 characters to encourage full sentences
        if (submission.getWord().trim().length() < 5) {
            logger.warn("Submit word failed - submission too short: {}", submission.getWord());
            return false;
        }

        // Check if word already used
        String lowercaseWord = submission.getWord().toLowerCase();
        if (gameState.getUsedWords().contains(lowercaseWord)) {
            logger.warn("Submit word failed - word '{}' has already been used in session {}",
                    lowercaseWord, sessionId);
            return false;
        }

        logger.debug("Adding word '{}' to used words list for session {}", lowercaseWord, sessionId);
        // Add to used words
        gameState.getUsedWords().add(lowercaseWord);

        // In the submitWord method:
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
        .orElseThrow(() -> new RuntimeException("Game session not found"));

        // Before you add just the lowercaseWord, modify to detect all word bank items
        List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(
            session.getContent().getContentData());

        // Find all words from the word bank in the submission
        List<String> usedWordsFromBank = new ArrayList<>();
        for (WordBankItem item : wordBankItems) {
            String word = item.getWord().toLowerCase();
            if (submission.getWord().toLowerCase().contains(word)) {
                usedWordsFromBank.add(word);
            }
        }

        // Add all detected words to the used words list
        gameState.getUsedWords().addAll(usedWordsFromBank);

        try {
            logger.debug("Sending word via chat service for session {}", sessionId);
            // Send message via chat service (which handles word bomb checking and scoring)
            ChatMessageEntity message = chatService.sendMessage(sessionId, userId, submission.getWord());
            
            // After submitting, check if this contribution was exceptional
            boolean wasExceptional = false;
            
            // Check for exceptional contribution
            if (message.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT) {
                if (message.getWordUsed() != null && !message.getWordUsed().isEmpty()) {
                    // Use ScoreService to handle exceptional contribution
                    scoreService.handleExceptionalContribution(sessionId, userId, submission.getWord());
                    wasExceptional = true;
                }
            }
            
            // Broadcast exceptional contributions to all players
            if (wasExceptional) {
                Map<String, Object> exceptionalNotice = new HashMap<>();
                exceptionalNotice.put("type", "exceptionalContribution");
                exceptionalNotice.put("playerName", currentPlayer.getUser().getFname() + " " + 
                                     currentPlayer.getUser().getLname());
                exceptionalNotice.put("message", submission.getWord());
                
                messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", 
                                               exceptionalNotice);
            }
        } catch (Exception e) {
            logger.error("Error sending word via chat service for session {}: {}", sessionId, e.getMessage(), e);
            return false;
        }
        trackTurnCompletion(currentPlayer, session);
        logger.info("Successfully processed word submission '{}' for session {} by user {}, advancing to next player",
                submission.getWord(), sessionId, userId);
    
        // Advance to next player's turn
        advanceToNextPlayer(sessionId);
        return true;
    }




    @Transactional(propagation = Propagation.REQUIRED)
    private void advanceToNextPlayer(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Game session not found for advancing turn: " + sessionId));
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            logger.error("GameState not found for active session {} during advanceToNextPlayer", sessionId);
            return;
        }

        int turnJustCompleted = gameState.getCurrentTurn();

        // Primary Game End Condition
        if (turnJustCompleted >= gameState.getTotalTurns()) {
            logger.info("All turns completed for session {}. Total turns: {}. Ending game.", sessionId, gameState.getTotalTurns());
            endGame(sessionId);
            return;
        }

        List<PlayerSessionEntity> players = playerRepository.findBySessionId(session.getId());
        if (players.isEmpty()) {
            logger.warn("No players in session {} to advance turn. Ending game.", sessionId);
            endGame(sessionId);
            return;
        }
        
        boolean isSinglePlayer = players.size() == 1;
        int upcomingTurnGlobal = turnJustCompleted + 1;
        session.setCurrentTurn(upcomingTurnGlobal);
        gameState.setCurrentTurn(upcomingTurnGlobal);

        if (isSinglePlayer) {
            // For single-player, cycle = turn number
            session.setCurrentCycle(upcomingTurnGlobal);
            gameState.setCurrentCycle(upcomingTurnGlobal);
            logger.info("Session {} (Single Player): Advanced to Turn/Cycle {}", sessionId, upcomingTurnGlobal);
        } else {
            // Multiplayer: Cycle increments when the turn wraps around to the first player
            PlayerSessionEntity previousPlayer = session.getCurrentPlayer();
            int previousPlayerIndex = -1;
            if (previousPlayer != null) {
                for (int i = 0; i < players.size(); i++) {
                    if (players.get(i).getId().equals(previousPlayer.getId())) {
                        previousPlayerIndex = i;
                        break;
                    }
                }
            }
            
            if (previousPlayerIndex == players.size() - 1) { // If the last player just finished their turn
                int newCycle = gameState.getCurrentCycle() + 1;
                session.setCurrentCycle(newCycle);
                gameState.setCurrentCycle(newCycle);
                logger.info("Session {} (Multiplayer): Advanced to Cycle {}. Current Turn: {}", sessionId, newCycle, upcomingTurnGlobal);
                
                // Reset used words for the new cycle if applicable
                gameState.getUsedWords().clear(); 
                Map<String, Object> cycleUpdate = new HashMap<>();
                cycleUpdate.put("type", "cycleChange");
                cycleUpdate.put("cycle", newCycle);
                cycleUpdate.put("usedWordsCleared", true);
                messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", cycleUpdate);
            } else {
                 logger.info("Session {} (Multiplayer): Advanced to Turn {}. Current Cycle: {}", sessionId, upcomingTurnGlobal, gameState.getCurrentCycle());
            }
        }
        
        selectNextPlayer(session); // Selects the next player and updates session.currentPlayer & gameState.currentPlayerId
        gameSessionRepository.save(session); // Save changes to session

        startNextTurn(sessionId); // Start the new turn
    }


    private double calculateTurnCompletionRate(StudentProgress progress, GameSessionEntity session) {
        if (session.getTotalTurns() <= 0) return 0;

        // Calculate based on player's turns taken vs total possible turns
        // Cap at 100% to prevent exceeding
        return Math.min(100.0, (progress.getTotalTurnsTaken() * 100.0) / session.getTotalTurns());
    }
    public void endGame(Long sessionId) {
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            return;
        }

        // Update database
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        session.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
        session.setEndedAt(new Date());
        gameSessionRepository.save(session);

        // Update in-memory state
        gameState.setStatus(GameState.Status.COMPLETED);

        // Broadcast game end
        Map<String, Object> endMessage = new HashMap<>();
        endMessage.put("event", "gameEnded");
        endMessage.put("sessionId", sessionId);
        endMessage.put("leaderboard", getSessionLeaderboard(sessionId));
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", endMessage);

        // Clean up
        activeGames.remove(sessionId);
    }

    public void joinGame(Long sessionId, Long userId) {
        logger.info("Player {} joining game {}", userId, sessionId);
        
        List<PlayerSessionDTO> playerDTOs = gameSessionService.getSessionPlayerDTOs(sessionId);
        
        logger.info("Found {} players in session", playerDTOs.size());
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/players", playerDTOs);
    }
    

@Transactional
public List<PlayerSessionDTO> getSessionPlayerList(Long sessionId) {
    return gameSessionService.getSessionPlayerDTOs(sessionId);
}

    @Transactional
    public GameStateDTO getGameState(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found: " + sessionId));
        GameStateDTO dto = new GameStateDTO();
        dto.setSessionId(sessionId);
        dto.setSessionCode(session.getSessionCode());
        dto.setStatus(session.getStatus().toString());


        List<PlayerSessionDTO> playerDTOs = gameSessionService.getSessionPlayerDTOs(sessionId).stream()
                .map(player -> {
                    PlayerSessionDTO playerDTO = new PlayerSessionDTO();
                    playerDTO.setId(player.getId());
                    playerDTO.setUserId(player.getUserId());
                    playerDTO.setPlayerName(player.getPlayerName());
                    playerDTO.setRole(player.getRole());
                    playerDTO.setTotalScore(player.getTotalScore());
                    playerDTO.setActive(player.isActive());
                    // Set the profile picture properly
                    playerDTO.setProfilePicture(playerRepository.findById(player.getId())
                            .map(PlayerSessionEntity::getUser)
                            .map(UserEntity::getProfilePicture)
                            .orElse(null));
                    return playerDTO;
                })
                .collect(Collectors.toList());
        dto.setPlayers(playerDTOs);

        if (session.getContent() != null) {
            Map<String, Object> contentInfo = new HashMap<>();
            contentInfo.put("id", session.getContent().getId());
            contentInfo.put("title", session.getContent().getTitle());
            contentInfo.put("description", session.getContent().getDescription());
            dto.setContentInfo(contentInfo);
            if (session.getContent().getContentData() != null) {
                dto.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
            }
            // Word Bank
            if (session.getContent().getContentData() != null) {
                List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(session.getContent().getContentData());
                List<WordBankItemDTO> wordBankDTOs = wordBankItems.stream()
                    .map(item -> new WordBankItemDTO(item.getId(), item.getWord(), item.getDescription(), item.getExampleUsage()))
                    .collect(Collectors.toList());
                dto.setWordBank(wordBankDTOs);
            }
        }
        
        dto.setLeaderboard(scoreService.getSessionLeaderboard(sessionId)); // Use ScoreService
        dto.setTimePerTurn(session.getTimePerTurn());
        dto.setTotalTurns(session.getTotalTurns());
        dto.setCurrentTurn(session.getCurrentTurn());
        dto.setCurrentCycle(session.getCurrentCycle());

        GameState activeGameState = activeGames.get(sessionId);
        if (activeGameState != null) { // If game is active and in memory
            dto.setStatus(activeGameState.getStatus().toString()); // More precise status
            dto.setTimeRemaining(activeGameState.getTimePerTurn() - (int)((System.currentTimeMillis() - activeGameState.getLastTurnTime()) / 1000));
            dto.setUsedWords(activeGameState.getUsedWords());
            dto.setStoryPrompt(activeGameState.getStoryPrompt());
            if (activeGameState.getConfiguredTurnCycles() > 0) {
                 dto.setTurnCyclesConfig(activeGameState.getConfiguredTurnCycles());
            } else if (session.getContent() != null && session.getContent().getGameConfig() != null) {
                dto.setTurnCyclesConfig(session.getContent().getGameConfig().getTurnCycles());
            }


            PlayerSessionEntity currentPlayerEntity = session.getCurrentPlayer();
            if (currentPlayerEntity != null) {
                Map<String, Object> currentPlayerMap = new HashMap<>();
                currentPlayerMap.put("id", currentPlayerEntity.getId()); // This is PlayerSessionEntity ID
                currentPlayerMap.put("userId", currentPlayerEntity.getUser().getId());
                currentPlayerMap.put("name", currentPlayerEntity.getUser().getFname() + " " + currentPlayerEntity.getUser().getLname());
                if (currentPlayerEntity.getRole() != null) {
                    currentPlayerMap.put("role", currentPlayerEntity.getRole().getName());
                }
                dto.setCurrentPlayer(currentPlayerMap);
            }
        } else { // If game is not active in memory (e.g., completed, pending)
             dto.setTimeRemaining(0); // Or based on session status
             if (session.getStatus() == GameSessionEntity.SessionStatus.COMPLETED) {
                 dto.setStoryPrompt("The game has ended.");
             }
        }
        
        // Add configured turn cycles for frontend display logic
        if (session.getContent() != null && session.getContent().getGameConfig() != null) {
            dto.setTurnCyclesConfig(session.getContent().getGameConfig().getTurnCycles());
        }

        return dto;
    }

    public List<Map<String, Object>> getSessionLeaderboard(Long sessionId) {

        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found for leaderboard: " + sessionId));
        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId);
        
        return players.stream().map(p -> {
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("id", p.getId()); // This is PlayerSessionEntity ID
            playerData.put("userId", p.getUser().getId());
            playerData.put("name", p.getUser().getFname() + " " + p.getUser().getLname());
            playerData.put("score", p.getTotalScore()); // Assumes PlayerSessionEntity has getTotalScore()
            playerData.put("role", p.getRole() != null ? p.getRole().getName() : null);
            playerData.put("profilePicture", p.getUser().getProfilePicture());
            return playerData;
        }).sorted(Comparator.comparingInt(p -> (int) ((Map<String, Object>)p).get("score")).reversed()) // Sort by score descending
          .collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 1000) // Check every second
    @Transactional(propagation = Propagation.REQUIRED)
    public void checkTurnTimers() {
        long currentTime = System.currentTimeMillis();
        activeGames.forEach((sessionId, gameState) -> {
            if (gameState.getStatus() == GameState.Status.TURN_IN_PROGRESS) {
                long turnStartTimeMs = gameState.getLastTurnTime(); // This should be the start of the current turn's timer
                int timePerTurnSec = gameState.getTimePerTurn();
                long elapsedSec = (currentTime - turnStartTimeMs) / 1000;
                int timeRemaining = timePerTurnSec - (int) elapsedSec;

                // Broadcast timer updates periodically
                if (timeRemaining >= 0 && (timeRemaining % 5 == 0 || timeRemaining <= 10 || timeRemaining == timePerTurnSec)) {
                    messagingTemplate.convertAndSend(
                        "/topic/game/" + sessionId + "/timer",
                        Collections.singletonMap("timeRemaining", timeRemaining)
                    );
                }

                if (timeRemaining <= 0) {
                    logger.info("Time up for player {} in session {}. Advancing turn.", gameState.getCurrentPlayerId(), sessionId);
                    PlayerSessionEntity player = playerRepository.findById(gameState.getCurrentPlayerId()).orElse(null);
                    if (player != null) {
                        awardPoints(sessionId, player.getUser().getId(), -5, "Missed turn"); // Penalty
                    }
                    advanceToNextPlayer(sessionId);
                }
            }
        });
    }


    private void awardPoints(Long sessionId, Long userId, int points, String reason) {
        
        scoreService.awardPoints(sessionId, userId, points, reason); // This line might be redundant if ScoreService.addScore also updates PlayerSessionEntity

        // Notify player about score change
        Map<String, Object> scoreUpdate = new HashMap<>();
        scoreUpdate.put("points", points);
        scoreUpdate.put("reason", reason);
        
        // Retrieve the updated total score from PlayerSessionEntity after scoreService.addScore has run
        PlayerSessionEntity playerSession = playerRepository.findBySessionIdAndUserId(sessionId, userId).stream().findFirst().orElse(null);
        if (playerSession != null) {
            scoreUpdate.put("totalScore", playerSession.getTotalScore());
        }

        // Find user email to send direct message
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getEmail() != null) {
             messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/score", scoreUpdate);
        }
        // Broadcast updated leaderboard
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/scores", getSessionLeaderboard(sessionId));
    }

    // Inner class for tracking game state
    static class GameState {
        private Long sessionId;
        private List<PlayerSessionEntity> players; // List of player entities in the game
        private Long currentPlayerId;
        private int currentTurn;
        private int totalTurns;
        private int timePerTurn; // seconds
        private Status status;
        private Date turnStartTime; // When the current turn logically started
        private long lastTurnTime;  // Timestamp (ms) when the current turn timer began
        private String backgroundImage;
        private List<String> usedWords = new ArrayList<>();
        private Map<String, Object> contentInfo;
        private int currentCycle;
        private String storyPrompt;
        private int configuredTurnCycles; // Store the original configured turnCycles

        enum Status {
            WAITING_TO_START,
            WAITING_FOR_PLAYER,
            TURN_IN_PROGRESS,
            COMPLETED
        }

        // Getters and Setters for all fields
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public List<PlayerSessionEntity> getPlayers() { return players; }
        public void setPlayers(List<PlayerSessionEntity> players) { this.players = players; }
        public Long getCurrentPlayerId() { return currentPlayerId; }
        public void setCurrentPlayerId(Long currentPlayerId) { this.currentPlayerId = currentPlayerId; }
        public int getCurrentTurn() { return currentTurn; }
        public void setCurrentTurn(int currentTurn) { this.currentTurn = currentTurn; }
        public int getTotalTurns() { return totalTurns; }
        public void setTotalTurns(int totalTurns) { this.totalTurns = totalTurns; }
        public int getTimePerTurn() { return timePerTurn; }
        public void setTimePerTurn(int timePerTurn) { this.timePerTurn = timePerTurn; }
        public Status getStatus() { return status; }
        public void setStatus(Status status) { this.status = status; }
        public Date getTurnStartTime() { return turnStartTime; }
        public void setTurnStartTime(Date turnStartTime) { this.turnStartTime = turnStartTime; }
        public long getLastTurnTime() { return lastTurnTime; }
        public void setLastTurnTime(long lastTurnTime) { this.lastTurnTime = lastTurnTime; }
        public String getBackgroundImage() { return backgroundImage; }
        public void setBackgroundImage(String backgroundImage) { this.backgroundImage = backgroundImage; }
        public List<String> getUsedWords() { return usedWords; }
        public void setUsedWords(List<String> usedWords) { this.usedWords = usedWords; }
        public Map<String, Object> getContentInfo() { return contentInfo; }
        public void setContentInfo(Map<String, Object> contentInfo) { this.contentInfo = contentInfo; }
        public int getCurrentCycle() { return currentCycle; }
        public void setCurrentCycle(int currentCycle) { this.currentCycle = currentCycle; }
        public String getStoryPrompt() { return storyPrompt; }
        public void setStoryPrompt(String storyPrompt) { this.storyPrompt = storyPrompt; }
        public int getConfiguredTurnCycles() { return configuredTurnCycles; }
        public void setConfiguredTurnCycles(int configuredTurnCycles) { this.configuredTurnCycles = configuredTurnCycles; }
    }
}