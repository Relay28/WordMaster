package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.GameStateDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import cit.edu.wrdmstr.dto.TurnInfoDTO;
import cit.edu.wrdmstr.dto.WordSubmissionDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
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
    private final GrammarCheckerService grammarCheckerService;
    private final PlayerSessionEntityRepository playerSessionEntityRepository;
    private final AIService aiService;
    
    // In-memory game state tracking
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
            PlayerSessionEntityRepository playerSessionEntityRepository,
            AIService aiService) {
        this.messagingTemplate = messagingTemplate;
        this.gameSessionRepository = gameSessionRepository;
        this.playerRepository = playerRepository;
        this.wordBankRepository = wordBankRepository;
        this.roleRepository = roleRepository;
        this.scoreRepository = scoreRepository;
        this.chatService = chatService;
        this.grammarCheckerService = grammarCheckerService;
        this.gameSessionService = gameSessionService;
        this.playerSessionEntityRepository = playerSessionEntityRepository;
        this.aiService = aiService;
    }

    @Transactional
    public void startGame(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));

        if (session.getStatus() == GameSessionEntity.SessionStatus.ACTIVE) {
            throw new IllegalStateException("Game is already active");
        }

        // Mark session as active
        session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
        session.setStartedAt(new Date());
        gameSessionRepository.save(session);

        // Get players
        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId);
        if (players.isEmpty()) {
            throw new IllegalStateException("Cannot start a game with no players");
        }

        // Initialize game state
        GameState gameState = new GameState();
        gameState.setSessionId(sessionId);
        gameState.setPlayers(players);
        gameState.setStatus(GameState.Status.WAITING_FOR_PLAYER);
        gameState.setTurnStartTime(new Date());
        gameState.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
        gameState.setUsedWords(new ArrayList<>());
        gameState.setCurrentCycle(1); // Set initial cycle
        gameState.setCurrentTurn(1);
        gameState.setTotalTurns(session.getTotalTurns());
        gameState.setTimePerTurn(session.getTimePerTurn());
        
        // Make sure to copy the total turns from the config
        if (session.getTotalTurns() == 0) {
            GameConfig config = session.getContent().getGameConfig();
            int totalTurns = config.getTurnCycles() * players.size();
            gameState.setTotalTurns(totalTurns);
            session.setTotalTurns(totalTurns);
            gameSessionRepository.save(session);
        }
        // Set content info
        Map<String, Object> contentInfo = new HashMap<>();
        contentInfo.put("id", session.getContent().getId());
        contentInfo.put("title", session.getContent().getTitle());
        contentInfo.put("description", session.getContent().getDescription());
        gameState.setContentInfo(contentInfo);

        // Store game state
        activeGames.put(sessionId, gameState);

        // Initialize game
        initializeGame(session);

        // Broadcast game started
        Map<String, Object> startedMessage = new HashMap<>();
        startedMessage.put("event", "gameStarted");
        startedMessage.put("sessionId", sessionId);
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", startedMessage);

        // Broadcast first turn
        startNextTurn(sessionId);
    }

    private void initializeGame(GameSessionEntity session) {
        // Get the game config from the content
        GameConfig gameConfig = session.getContent().getGameConfig();
        
        // Use turn cycles directly from config without multiplying by player count
        int totalTurns = gameConfig.getTurnCycles();
        System.out.println("Setting total turns to: " + totalTurns + " (from config turnCycles)");
        session.setTotalTurns(totalTurns);
        
            // Make sure gameState also gets updated
        GameState gameState = activeGames.get(session.getId());
        if (gameState != null) {
            gameState.setTotalTurns(totalTurns);
        }
        
        // Set the correct turn time from content config
        session.setTimePerTurn(gameConfig.getTimePerTurn());
        
        // Make sure to reset and initialize first turn properly
        session.setCurrentTurn(1);
        session.setCurrentCycle(1);
        
        // Important: Select the first player immediately when game starts
        selectNextPlayer(session);
        
        // Generate and send initial story prompt
        String initialStoryElement = generateStoryElement(session, 1);
        Map<String, Object> storyUpdate = new HashMap<>();
        storyUpdate.put("type", "storyUpdate");
        storyUpdate.put("content", initialStoryElement);
        
        messagingTemplate.convertAndSend(
            "/topic/game/" + session.getId() + "/updates",
            storyUpdate
        );
        
        // Make sure to reset the timer for the first turn
        resetTurnTimer(session);
        
        // Save the updated session
        gameSessionRepository.save(session);
        
        // Send the initial game state to all clients immediately
        broadcastGameState(session);
    }

    // Update this method if it exists, or create it if it doesn't
    private void selectNextPlayer(GameSessionEntity session) {
        List<PlayerSessionEntity> players = new ArrayList<>(session.getPlayers());
        
        if (players.isEmpty()) {
            logger.warn("No players available to select as next player");
            return;
        }
        
        // Sort players by some consistent order (e.g., by ID)
        players.sort(Comparator.comparing(PlayerSessionEntity::getId));
        
        // If it's the first turn, select the first player
        if (session.getCurrentTurn() == 1 || session.getCurrentPlayer() == null) {
            session.setCurrentPlayer(players.get(0));
            
            // Make sure to update the GameState too
            GameState gameState = activeGames.get(session.getId());
            if (gameState != null) {
                gameState.setCurrentPlayerId(players.get(0).getId());
            }
            return;
        }
        
        // Find current player index
        int currentIndex = -1;
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getId().equals(session.getCurrentPlayer().getId())) {
                currentIndex = i;
                break;
            }
        }
        
        // Move to next player
        int nextIndex = (currentIndex + 1) % players.size();
        session.setCurrentPlayer(players.get(nextIndex));
        
        // Make sure to update the GameState too
        GameState gameState = activeGames.get(session.getId());
        if (gameState != null) {
            gameState.setCurrentPlayerId(players.get(nextIndex).getId());
        }
    }
    
    private void resetTurnTimer(GameSessionEntity session) {
        GameState gameState = activeGames.get(session.getId());
        if (gameState != null) {
            gameState.setTurnStartTime(new Date());
            gameState.setLastTurnTime(System.currentTimeMillis());
            
            // Also update the game state to match the session
            gameState.setCurrentTurn(session.getCurrentTurn());
            gameState.setTotalTurns(session.getTotalTurns());
            gameState.setTimePerTurn(session.getTimePerTurn());
            
            if (session.getCurrentPlayer() != null) {
                gameState.setCurrentPlayerId(session.getCurrentPlayer().getId());
            }
        }
    }
    
    // Add this broadcastGameState method
    private void broadcastGameState(GameSessionEntity session) {
        GameStateDTO gameState = getGameState(session.getId());
        messagingTemplate.convertAndSend("/topic/game/" + session.getId() + "/state", gameState);
    }

    // Replace the existing generateStoryElement method with this improved version
    @Transactional(propagation = Propagation.REQUIRED)
    private String generateStoryElement(GameSessionEntity session, int turnNumber) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("task", "story_prompt");
            request.put("content", session.getContent().getDescription());
            request.put("turn", turnNumber);
            
            // Only add used words if they exist
            GameState gameState = activeGames.get(session.getId());
            if (gameState != null && gameState.getUsedWords() != null && !gameState.getUsedWords().isEmpty()) {
                request.put("usedWords", gameState.getUsedWords());
            }
            
            return aiService.callAIModel(request).getResult();
        } catch (Exception e) {
            logger.error("Error generating story element: " + e.getMessage(), e);
            return "Continue the conversation based on your role!";
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
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            throw new IllegalStateException("Game session not active");
        }

        // Check if game should end
        if (gameState.getCurrentTurn() > gameState.getTotalTurns()) {
            endGame(sessionId);
            return;
        }

        // Generate and add story element
    GameSessionEntity session = gameSessionRepository.findById(sessionId).orElse(null);
    if (session != null) {
        String storyElement = generateStoryElement(session, gameState.getCurrentTurn());
        
        Map<String, Object> storyUpdate = new HashMap<>();
        storyUpdate.put("type", "storyUpdate");
        storyUpdate.put("content", storyElement);
        
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/updates",
            storyUpdate
        );
    }

        // Set up turn
        gameState.setStatus(GameState.Status.TURN_IN_PROGRESS);
        gameState.setTurnStartTime(new Date());

        // Get current player
        PlayerSessionEntity currentPlayer = playerRepository.findById(gameState.getCurrentPlayerId())
                .orElseThrow(() -> new RuntimeException("Current player not found"));

        // Prepare turn info
        TurnInfoDTO turnInfo = new TurnInfoDTO();
        turnInfo.setTurnNumber(gameState.getCurrentTurn());
        turnInfo.setPlayerId(currentPlayer.getId());
        turnInfo.setPlayerName(currentPlayer.getUser().getFname() + " " + currentPlayer.getUser().getLname());
        turnInfo.setTimeRemaining(gameState.getTimePerTurn());
        
        if (currentPlayer.getRole() != null) {
            turnInfo.setRoleName(currentPlayer.getRole().getName());
        }
        
        turnInfo.setWordBomb(currentPlayer.getCurrentWordBomb());

        // Broadcast turn info
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/turn", turnInfo);

        // Schedule turn end if needed
        gameState.setLastTurnTime(System.currentTimeMillis());
    }

    public boolean submitWord(Long sessionId, Long userId, WordSubmissionDTO submission) {
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null || gameState.getStatus() != GameState.Status.TURN_IN_PROGRESS) {
            return false;
        }

        // Verify it's the user's turn
        PlayerSessionEntity currentPlayer = playerRepository.findById(gameState.getCurrentPlayerId())
                .orElseThrow(() -> new RuntimeException("Current player not found"));

        if (!(currentPlayer.getUser().getId() == userId)) {
            return false;
        }

        // Check if word already used
        if (gameState.getUsedWords().contains(submission.getWord().toLowerCase())) {
            return false;
        }

        // Add to used words
        gameState.getUsedWords().add(submission.getWord().toLowerCase());

        // Send message via chat service (which handles word bomb checking and scoring)
        chatService.sendMessage(sessionId, userId, submission.getSentence());

        // Advance to next player's turn
        advanceToNextPlayer(sessionId);
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    private void advanceToNextPlayer(Long sessionId) {
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            return;
        }

        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId);
        if (players.isEmpty()) {
            endGame(sessionId);
            return;
        }

        // Find next player index
        int currentIndex = -1;
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getId().equals(gameState.getCurrentPlayerId())) {
                currentIndex = i;
                break;
            }
        }

        // Move to next player
        int nextIndex = (currentIndex + 1) % players.size();
        gameState.setCurrentPlayerId(players.get(nextIndex).getId());
        
        // If we've completed a full cycle through all players
        if (nextIndex == 0) {
            gameState.setCurrentCycle(gameState.getCurrentCycle() + 1);
        }
        
        gameState.setCurrentTurn(gameState.getCurrentTurn() + 1);

        // Start next turn
        startNextTurn(sessionId);
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
        GameState gameState = activeGames.get(sessionId);
        
        // If game is not active, fetch from database
        if (gameState == null) {
            GameSessionEntity session = gameSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Game session not found"));
                    
            GameStateDTO dto = new GameStateDTO();
            dto.setSessionId(sessionId);
            dto.setSessionCode(session.getSessionCode()); // Make sure this line is present
            dto.setStatus(session.getStatus().toString());
            dto.setPlayers(gameSessionService.getSessionPlayerDTOs(sessionId));

            // Set basic info from database
            if (session.getContent() != null) {
                Map<String, Object> contentInfo = new HashMap<>();
                contentInfo.put("id", session.getContent().getId());
                contentInfo.put("title", session.getContent().getTitle());
                contentInfo.put("description", session.getContent().getDescription());
                dto.setContentInfo(contentInfo);
                
                if (session.getContent().getContentData() != null) {
                    dto.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
                }
            }
            
            // Add word bank to DTO
            if (session.getContent() != null && session.getContent().getContentData() != null) {
                List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(session.getContent().getContentData());
                List<String> words = wordBankItems.stream()
                    .map(WordBankItem::getWord)
                    .collect(Collectors.toList());
                dto.setWordBank(words);
            }
            
            // Set leaderboard
            dto.setLeaderboard(getSessionLeaderboard(sessionId));
            
            return dto;
        }
        
        // Game is active, convert from game state
        GameStateDTO dto = new GameStateDTO();
        dto.setSessionId(sessionId);
        
        // Make sure to set sessionCode here too for active games
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        dto.setSessionCode(session.getSessionCode());
        dto.setPlayers(gameSessionService.getSessionPlayerDTOs(sessionId));
        dto.setStatus(gameState.getStatus().toString());
        dto.setCurrentTurn(gameState.getCurrentTurn());
        dto.setTotalTurns(gameState.getTotalTurns());
        dto.setTimePerTurn(session.getTimePerTurn()); // Make sure this field exists in GameStateDTO
        
        // Add this code to set the word bank for active games
        if (session.getContent() != null && session.getContent().getContentData() != null) {
            List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(session.getContent().getContentData());
            List<String> words = wordBankItems.stream()
                .map(WordBankItem::getWord)
                .collect(Collectors.toList());
            dto.setWordBank(words);
        }
        
        // Set current player info with role
        if (gameState.getCurrentPlayerId() != null) {
            PlayerSessionEntity currentPlayer = playerRepository.findById(gameState.getCurrentPlayerId()).orElse(null);
            if (currentPlayer != null) {
                Map<String, Object> currentPlayerMap = new HashMap<>();
                currentPlayerMap.put("id", currentPlayer.getId());
                currentPlayerMap.put("name", currentPlayer.getUser().getFname() + " " + currentPlayer.getUser().getLname());
                
                // Make sure role name is included
                if (currentPlayer.getRole() != null) {
                    currentPlayerMap.put("role", currentPlayer.getRole().getName());
                }
                
                dto.setCurrentPlayer(currentPlayerMap);
            }
        }
        
        return dto;
    }

    public List<Map<String, Object>> getSessionLeaderboard(Long sessionId) {
        List<PlayerSessionEntity> players = playerRepository.findBySessionIdOrderByTotalScoreDesc(sessionId);
        
        return players.stream().map(p -> {
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("id", p.getId());
            playerData.put("userId", p.getUser().getId());
            playerData.put("name", p.getUser().getFname() + " " + p.getUser().getLname());
            playerData.put("score", p.getTotalScore());
            playerData.put("role", p.getRole() != null ? p.getRole().getName() : null);
            return playerData;
        }).collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 1000) // Check every second
    @Transactional(propagation = Propagation.REQUIRED)
    public void checkTurnTimers() {
        long currentTime = System.currentTimeMillis();
        
        activeGames.forEach((sessionId, gameState) -> {
            if (gameState.getStatus() == GameState.Status.TURN_IN_PROGRESS) {
                long elapsed = (currentTime - gameState.getLastTurnTime()) / 1000;
                int timeRemaining = gameState.getTimePerTurn() - (int) elapsed;
                
                // Update remaining time for clients
                if (timeRemaining % 5 == 0 || timeRemaining <= 10) { // Update every 5 seconds or during last 10 seconds
                    messagingTemplate.convertAndSend(
                        "/topic/game/" + sessionId + "/timer", 
                        Collections.singletonMap("timeRemaining", timeRemaining)
                    );
                }
                
                // Auto-advance turn if time's up
                if (timeRemaining <= 0) {
                    // Player missed their turn
                    PlayerSessionEntity player = playerRepository.findById(gameState.getCurrentPlayerId()).orElse(null);
                    if (player != null) {
                        // Penalty for missing turn
                        awardPoints(sessionId, player.getUser().getId(), -5, "Missed turn");
                    }
                    
                    advanceToNextPlayer(sessionId);
                }
            }
        });
    }

    private void awardPoints(Long sessionId, Long userId, int points, String reason) {
        List<PlayerSessionEntity> players = playerSessionEntityRepository.findBySessionIdAndUserId(sessionId, userId);
        if (players.isEmpty()) {
            throw new RuntimeException("Player not found in session");
        }
        PlayerSessionEntity player = players.get(0);
        
        ScoreRecordEntity score = new ScoreRecordEntity();
        score.setSession(player.getSession());
        score.setUser(player.getUser());
        score.setPoints(points);
        score.setReason(reason);
        score.setTimestamp(new Date());
        scoreRepository.save(score);
        
        // Update player score
        player.setTotalScore(player.getTotalScore() + points);
        playerRepository.save(player);
        
        // Broadcast updated score
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/scores",
            Collections.singletonMap("playerId", userId)
        );
        
        // Add this to notify the player
        Map<String, Object> scoreUpdate = new HashMap<>();
        scoreUpdate.put("points", points);
        scoreUpdate.put("reason", reason);
        
        // Get the user's email for sending to their queue
        String userEmail = player.getUser().getEmail();
        messagingTemplate.convertAndSendToUser(
            userEmail,
            "/queue/score",
            scoreUpdate
        );
    }

    // Inner class for tracking game state
    static class GameState {
        private Long sessionId;
        private List<PlayerSessionEntity> players;
        private Long currentPlayerId;
        private int currentTurn;
        private int totalTurns;
        private int timePerTurn;
        private Status status;
        private Date turnStartTime;
        private long lastTurnTime;
        private String backgroundImage;
        private List<String> usedWords;
        private Map<String, Object> contentInfo;
        private int currentCycle; // Add cycle counter

        enum Status {
            WAITING_TO_START,
            WAITING_FOR_PLAYER,
            TURN_IN_PROGRESS,
            COMPLETED
        }

        // Getters and setters for GameState fields
        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }

        public List<PlayerSessionEntity> getPlayers() {
            return players;
        }

        public void setPlayers(List<PlayerSessionEntity> players) {
            this.players = players;
        }

        public Long getCurrentPlayerId() {
            return currentPlayerId;
        }

        public void setCurrentPlayerId(Long currentPlayerId) {
            this.currentPlayerId = currentPlayerId;
        }

        public int getCurrentTurn() {
            return currentTurn;
        }

        public void setCurrentTurn(int currentTurn) {
            this.currentTurn = currentTurn;
        }

        public int getTotalTurns() {
            return totalTurns;
        }

        public void setTotalTurns(int totalTurns) {
            this.totalTurns = totalTurns;
        }

        public int getTimePerTurn() {
            return timePerTurn;
        }

        public void setTimePerTurn(int timePerTurn) {
            this.timePerTurn = timePerTurn;
        }

        public Status getStatus() {
            return status;
        }

        public void setStatus(Status status) {
            this.status = status;
        }

        public Date getTurnStartTime() {
            return turnStartTime;
        }

        public void setTurnStartTime(Date turnStartTime) {
            this.turnStartTime = turnStartTime;
        }

        public long getLastTurnTime() {
            return lastTurnTime;
        }

        public void setLastTurnTime(long lastTurnTime) {
            this.lastTurnTime = lastTurnTime;
        }

        public String getBackgroundImage() {
            return backgroundImage;
        }

        public void setBackgroundImage(String backgroundImage) {
            this.backgroundImage = backgroundImage;
        }

        public List<String> getUsedWords() {
            return usedWords;
        }

        public void setUsedWords(List<String> usedWords) {
            this.usedWords = usedWords;
        }

        public Map<String, Object> getContentInfo() {
            return contentInfo;
        }

        public void setContentInfo(Map<String, Object> contentInfo) {
            this.contentInfo = contentInfo;
        }

        public int getCurrentCycle() {
            return currentCycle;
        }

        public void setCurrentCycle(int currentCycle) {
            this.currentCycle = currentCycle;
        }
    }
}