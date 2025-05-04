package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.GameStateDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import cit.edu.wrdmstr.dto.TurnInfoDTO;
import cit.edu.wrdmstr.dto.WordSubmissionDTO;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
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
    private final GameSessionService gameSessionService; // Add this line
    private final GrammarCheckerService grammarCheckerService; //unused atm
    private final PlayerSessionEntityRepository playerSessionEntityRepository; // Add this line
    

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
            PlayerSessionEntityRepository playerSessionEntityRepository) {  // Add this parameter
        this.messagingTemplate = messagingTemplate;
        this.gameSessionRepository = gameSessionRepository;
        this.playerRepository = playerRepository;
        this.wordBankRepository = wordBankRepository;
        this.roleRepository = roleRepository;
        this.scoreRepository = scoreRepository;
        this.chatService = chatService;
        this.grammarCheckerService = grammarCheckerService;
        this.gameSessionService = gameSessionService; 
        this.playerSessionEntityRepository= playerSessionEntityRepository; // Add this line
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

        // Get game configuration
        GameConfig gameConfig = session.getContent().getGameConfig();
        int timePerTurn = gameConfig.getTimePerTurn();
        int turnCycles = gameConfig.getTurnCycles();

        // Assign roles if they exist
        List<Role> roles = roleRepository.findByContentData(session.getContent().getContentData());
        if (!roles.isEmpty()) {
            assignRoles(players, roles);
        }

        // Assign word bombs
        List<WordBankItem> wordBank = wordBankRepository.findByContentData(session.getContent().getContentData());
        if (!wordBank.isEmpty()) {
            assignWordBombs(players, wordBank);
        }

        // Initialize game state
        GameState gameState = new GameState();
        gameState.setSessionId(sessionId);
        gameState.setPlayers(players);
        gameState.setTimePerTurn(timePerTurn);
        gameState.setTotalTurns(players.size() * turnCycles);
        gameState.setCurrentTurn(1);
        gameState.setCurrentPlayerId(players.get(0).getId());
        gameState.setStatus(GameState.Status.WAITING_FOR_PLAYER);
        gameState.setTurnStartTime(new Date());
        gameState.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
        gameState.setUsedWords(new ArrayList<>());

        // Set content info
        Map<String, Object> contentInfo = new HashMap<>();
        contentInfo.put("id", session.getContent().getId());
        contentInfo.put("title", session.getContent().getTitle());
        contentInfo.put("description", session.getContent().getDescription());
        gameState.setContentInfo(contentInfo);

        // Store game state
        activeGames.put(sessionId, gameState);

        // Broadcast game started
        Map<String, Object> startedMessage = new HashMap<>();
        startedMessage.put("event", "gameStarted");
        startedMessage.put("sessionId", sessionId);
        startedMessage.put("timePerTurn", timePerTurn);
        startedMessage.put("totalTurns", gameState.getTotalTurns());
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", startedMessage);

        // Broadcast first turn
        startNextTurn(sessionId);
    }

    private void assignRoles(List<PlayerSessionEntity> players, List<Role> roles) {
        Random random = new Random();
        int numRoles = roles.size();

        for (int i = 0; i < players.size(); i++) {
            Role role = roles.get(i % numRoles);
            PlayerSessionEntity player = players.get(i);
            player.setRole(role);
            playerRepository.save(player);
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
    
    @Transactional
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
        
        // Rest of your existing code...
        
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
    }
}