package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.ComprehensionCheckService;
import cit.edu.wrdmstr.service.ProgressTrackingService;
import cit.edu.wrdmstr.service.StoryPromptService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.context.event.EventListener;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
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
    @Autowired private StoryPromptService storyPromptService;
    private final GrammarCheckerService grammarCheckerService;
    private final AIService aiService;
    @Autowired private ScoreService scoreService;
    @Autowired private WordDetectionService wordDetectionService;
    private final StudentProgressRepository progressRepository;
    @Autowired private GameResultService gameResultService;
    @Autowired private ComprehensionCheckService comprehensionCheckService;
    @Autowired
    private ProgressTrackingService progressTrackingService;
    @Autowired private ApplicationEventPublisher eventPublisher;
    private final Map<Long, GameState> activeGames = new ConcurrentHashMap<>();

    // Add caching for AI requests
    private final Map<String, String> aiResponseCache = new ConcurrentHashMap<>();
    private final Map<Long, Long> lastProcessingTime = new ConcurrentHashMap<>();

    // Add a flag to prevent multiple story generations for the same turn
    private final Map<Long, Integer> lastStoryTurn = new ConcurrentHashMap<>();

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

    @Async("gameProcessingExecutor") // Process async for single player
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CompletableFuture<Void> processWordSubmissionAsync(Long sessionId, Long userId,
                                                             WordSubmissionDTO submission) {
        return CompletableFuture.runAsync(() -> {
            try {
                // Skip processing if too frequent (debouncing)
                Long lastTime = lastProcessingTime.get(userId);
                long currentTime = System.currentTimeMillis();
                if (lastTime != null && (currentTime - lastTime) < 1000) { // 1 second debounce
                    logger.debug("Debounced word submission for user {} in session {}", userId, sessionId);
                    return;
                }
                lastProcessingTime.put(userId, currentTime);

                GameSessionEntity session = gameSessionRepository.findById(sessionId)
                        .orElseThrow(() -> new IllegalStateException("Session not found"));

                boolean isSinglePlayer = session.getPlayers().size() == 1;
                if (isSinglePlayer) {
                    processSinglePlayerSubmission(sessionId, userId, submission);
                } else {
                    processMultiplayerSubmission(sessionId, userId, submission);
                }

            } catch (Exception e) {
                logger.error("Error processing word submission async: ", e);
            }
        });
    }

    private void processSinglePlayerSubmission(Long sessionId, Long userId, WordSubmissionDTO submission) {
        // Immediate response for UI responsiveness
        broadcastImmediateResponse(sessionId, userId);
        // Process in background
        processSubmissionInBackground(sessionId, userId, submission);
    }
    private void processMultiplayerSubmission(Long sessionId, Long userId, WordSubmissionDTO submission) {
        // Standard synchronous processing for multiplayer
        submitWord(sessionId, userId, submission);
    }

    private void broadcastImmediateResponse(Long sessionId, Long userId) {
        // Send immediate acknowledgment
        Map<String, Object> response = new HashMap<>();
        response.put("type", "submission_received");
        response.put("userId", userId);
        response.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", response);
    }

    // --- Timer Pause / Resume Helpers ---
    private void pauseTimer(Long sessionId) {
        GameState gs = activeGames.get(sessionId);
        if (gs == null || gs.getStatus() != GameState.Status.TURN_IN_PROGRESS || gs.paused) return;
        long now = System.currentTimeMillis();
        int elapsed = (int)((now - gs.getLastTurnTime())/1000);
        int remaining = Math.max(0, gs.getTimePerTurn() - elapsed);
        gs.paused = true;
        gs.pausedRemainingTime = remaining;
        Map<String,Object> payload = new HashMap<>();
        payload.put("timeRemaining", remaining);
        payload.put("paused", true);
        payload.put("timestamp", now);
        messagingTemplate.convertAndSend("/topic/game/"+sessionId+"/timer", payload);
    }

    private void resumeTimer(Long sessionId) {
        GameState gs = activeGames.get(sessionId);
        if (gs == null || !gs.paused) return;
        long now = System.currentTimeMillis();
        int remaining = gs.pausedRemainingTime;
        // Adjust lastTurnTime so countdown continues correctly
        gs.setLastTurnTime(now - (long)(gs.getTimePerTurn() - remaining) * 1000L);
        gs.paused = false;
        Map<String,Object> payload = new HashMap<>();
        payload.put("timeRemaining", remaining);
        payload.put("paused", false);
        payload.put("timestamp", now);
        messagingTemplate.convertAndSend("/topic/game/"+sessionId+"/timer", payload);
    }

    @EventListener
    public void onPauseEvent(TimerPauseEvent evt){ pauseTimer(evt.sessionId()); }
    @EventListener
    public void onResumeEvent(TimerResumeEvent evt){ resumeTimer(evt.sessionId()); }

    @Async("backgroundProcessingExecutor")
    private void processSubmissionInBackground(Long sessionId, Long userId, WordSubmissionDTO submission) {
        try {
            // Process with optimizations
            submitWordOptimized(sessionId, userId, submission);
        } catch (Exception e) {
            logger.error("Background processing error: ", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean submitWordOptimized(Long sessionId, Long userId, WordSubmissionDTO submission) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalStateException("Session not found"));
        // Skip some validations for single player to improve speed
        boolean isSinglePlayer = session.getPlayers().size() == 1;
        
        // Basic validation (can be expanded)
        if (submission.getWord() == null || submission.getWord().trim().isEmpty()) {
            logger.warn("Optimized submission failed - word is empty for session {} by user {}", sessionId, userId);
            return false;
        }
        
        // Process chat message with optimizations
        // Assuming chatService.sendMessageOptimized exists or is adapted from sendMessage
        // For simplicity, using sendMessage if sendMessageOptimized is not distinctly different or implemented in ChatService
        // If sendMessageOptimized has specific logic (e.g., different validation), ensure it's used.
        chatService.sendMessageOptimized(sessionId, userId, submission.getWord(), isSinglePlayer);
        
        // Handle turn advancement
        if (isSinglePlayer) {
            handleSinglePlayerTurnAdvancement(sessionId);
        } else {
            // Track turn completion for progress (async for multiplayer too)
            PlayerSessionEntity player = playerRepository.findBySessionIdAndUserId(sessionId, userId)
                .stream().findFirst().orElse(null);
            if (player != null) {
                CompletableFuture.runAsync(() -> trackTurnCompletion(player, session));
            }
            advanceToNextPlayer(sessionId);
        }
        return true;
    }

    private void handleSinglePlayerTurnAdvancement(Long sessionId) {
        GameState gameState = activeGames.get(sessionId);
        GameSessionEntity session = gameSessionRepository.findById(sessionId).orElse(null);

        if (gameState != null && session != null) {
            int nextTurn = gameState.getCurrentTurn() + 1;
            // Check if game should end
            if (nextTurn > gameState.getTotalTurns()) {
                endGame(sessionId);
                return;
            }

            // Update turn
            gameState.setCurrentTurn(nextTurn);
            gameState.setCurrentCycle(nextTurn); // For single player
            session.setCurrentTurn(nextTurn);
            session.setCurrentCycle(nextTurn);

            resetTurnTimer(session);
            // Generate story prompt asynchronously
            CompletableFuture.runAsync(() -> {
                String storyElement = generateStoryElementCached(session, nextTurn);
                gameState.setStoryPrompt(storyElement);

                Map<String, Object> storyUpdate = new HashMap<>();
                storyUpdate.put("type", "storyUpdate");
                storyUpdate.put("content", storyElement);
                messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", storyUpdate);
            });
            // Broadcast turn update
            broadcastTurnUpdate(sessionId, gameState, session);
            gameSessionRepository.save(session); // Persist session changes
        }
    }
    
    // Cached story generation
    private String generateStoryElementCached(GameSessionEntity session, int turnNumber) {
        String cacheKey = session.getId() + "_" + turnNumber;
        
        // Check if we've already generated for this turn
        Integer lastTurn = lastStoryTurn.get(session.getId());
        if (lastTurn != null && lastTurn == turnNumber) {
            String existing = storyPromptService.getLatestStoryPrompt(session.getId());
            if (existing != null) {
                return existing;
            }
        }
        
        return aiResponseCache.computeIfAbsent(cacheKey, key -> {
            try {
                lastStoryTurn.put(session.getId(), turnNumber);
                return generateStoryElement(session, turnNumber);
            } catch (Exception e) {
                logger.error("Error generating story element: ", e);
                return "Continue your story..."; // Fallback prompt
            }
        });
    }

    @Transactional
    public void startGame(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        if (session.getStatus() == GameSessionEntity.SessionStatus.ACTIVE) {
            logger.warn("Game session {} is already active", sessionId);
            return;
        }

        session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
        session.setStartedAt(new Date());


        // Use active players only
        List<PlayerSessionEntity> players = playerRepository.findActiveBySessionId(sessionId);
        if (players.isEmpty()) {
            throw new RuntimeException("No active players found for session " + sessionId);
        }

        // Generate cards for all players in the session


        GameState gameState = new GameState();
        gameState.setSessionId(sessionId);
        gameState.setPlayers(players);
        gameState.setStatus(GameState.Status.WAITING_FOR_PLAYER);
        gameState.setTurnStartTime(new Date());
        if (session.getContent() != null && session.getContent().getContentData() != null) {
            gameState.setBackgroundImage(session.getContent().getContentData().getBackgroundImage());
        }
        gameState.setUsedWords(new ArrayList<>());
        Map<String, Object> contentInfo = new HashMap<>();
        if (session.getContent() != null) {
            contentInfo.put("id", session.getContent().getId());
            contentInfo.put("title", session.getContent().getTitle());
            contentInfo.put("description", session.getContent().getDescription());
        }
        gameState.setContentInfo(contentInfo);
        initializeGame(session, gameState, players);
        
        gameSessionRepository.save(session);
        activeGames.put(sessionId, gameState);

        Map<String, Object> startedMessage = new HashMap<>();
        startedMessage.put("event", "gameStarted");
        startedMessage.put("sessionId", sessionId);
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", startedMessage);
        startNextTurn(sessionId);
    }

    
    private void trackTurnCompletion(PlayerSessionEntity player, GameSessionEntity session) {
        try {
            long turnEndTime = System.currentTimeMillis();
            GameState gameState = activeGames.get(session.getId());

            if (gameState != null) {
                long turnStartTime = gameState.getLastTurnTime();
                double responseTime = (turnEndTime - turnStartTime) / 1000.0;

                StudentProgress progress = progressTrackingService.getStudentProgress(
                        player.getUser().getId(), session.getId());
                progress.setTotalTurnsTaken(progress.getTotalTurnsTaken() + 1);
                progress.setTotalResponseTime(progress.getTotalResponseTime() + responseTime);

                double turnCompletionRate = calculateTurnCompletionRate(progress, session);
                double avgResponseTime = progress.getTotalTurnsTaken() > 0 ?
                        progress.getTotalResponseTime() / progress.getTotalTurnsTaken() : 0;
                progress.setTurnCompletionRate(turnCompletionRate);
                progress.setAvgResponseTime(avgResponseTime);
                progressRepository.save(progress);

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

        int configuredTurnCycles = gameConfig.getTurnCycles() != null ? gameConfig.getTurnCycles() : 1;
        int totalTurns;
        boolean isSinglePlayer = players.size() == 1;

        if (isSinglePlayer) {
            totalTurns = configuredTurnCycles;
        } else {
            totalTurns = configuredTurnCycles * players.size();
        }

        session.setTotalTurns(totalTurns);
        session.setCurrentTurn(1);
        session.setCurrentCycle(1);
        session.setTimePerTurn(gameConfig.getTimePerTurn() != null ? gameConfig.getTimePerTurn() : 60);

        gameState.setTotalTurns(totalTurns);
        gameState.setCurrentTurn(1);
        gameState.setCurrentCycle(1);
        gameState.setTimePerTurn(session.getTimePerTurn());
        gameState.setConfiguredTurnCycles(configuredTurnCycles);

        logger.info("Game Initialized for session {}: SinglePlayer={}, TotalTurns={}, CurrentTurn=1, CurrentCycle=1, ConfiguredCycles={}",
            session.getId(), isSinglePlayer, totalTurns, configuredTurnCycles);
        
        List<Role> roles = roleRepository.findByContentDataContentId(session.getContent().getId());
        if (!roles.isEmpty()) {
            assignRoles(players, roles);
        }

        if (!players.isEmpty()) {
            selectNextPlayer(session);
            if (session.getCurrentPlayer() != null) {
                gameState.setCurrentPlayerId(session.getCurrentPlayer().getId());
            }
        }
        
        // Generate initial story prompt only once at game start
        String initialStoryElement = generateStoryElementCached(session, 1);
        Map<String, Object> storyUpdate = new HashMap<>();
        storyUpdate.put("type", "storyUpdate");
        storyUpdate.put("content", initialStoryElement);
        gameState.setStoryPrompt(initialStoryElement);
        
        messagingTemplate.convertAndSend("/topic/game/" + session.getId() + "/updates", storyUpdate);
        resetTurnTimer(session);
    }

    @Transactional
    private void assignRoles(List<PlayerSessionEntity> players, List<Role> roles) {
        Random random = new Random();
        int numRoles = roles.size();
        
        logger.info("Starting role assignment: {} roles for {} players", numRoles, players.size());
        for (Role role : roles) {
            logger.info("Available role: ID={}, Name={}", role.getId(), role.getName());
        }
        
        List<Role> shuffledRoles = new ArrayList<>(roles);
        Collections.shuffle(shuffledRoles);
        
        for (int i = 0; i < players.size(); i++) {
            PlayerSessionEntity player = players.get(i);
            Role role = shuffledRoles.get(i % numRoles);
            
            logger.info("Assigning role '{}' (ID: {}) to player: {} {}",
                        role.getName(), role.getId(),
                        player.getUser().getFname(),
                        player.getUser().getLname());
            player.setRole(role);
            PlayerSessionEntity savedPlayer = playerRepository.save(player);
            logger.info("After save - Player ID: {}, Role: {}",
                        savedPlayer.getId(),
                        savedPlayer.getRole() != null ? savedPlayer.getRole().getName() : "null");
        }
        
        logger.info("Verifying all player role assignments:");
        for (PlayerSessionEntity player : playerRepository.findBySessionId(players.get(0).getSession().getId())) {
            logger.info("Player: {} {}, Role: {}",
                       player.getUser().getFname(),
                       player.getUser().getLname(),
                       player.getRole() != null ? player.getRole().getName() : "null");
        }
    }
    
    private void selectNextPlayer(GameSessionEntity session) {
        List<PlayerSessionEntity> players = playerRepository.findBySessionId(session.getId());
        
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
            gameState.setTurnStartTime(new Date());
            gameState.setLastTurnTime(System.currentTimeMillis());
            
            gameState.setCurrentTurn(session.getCurrentTurn());
            gameState.setTotalTurns(session.getTotalTurns());
            gameState.setTimePerTurn(session.getTimePerTurn());
            gameState.setCurrentCycle(session.getCurrentCycle());
            if (session.getCurrentPlayer() != null) {
                gameState.setCurrentPlayerId(session.getCurrentPlayer().getId());
            }
        }
    }
    
    private void broadcastGameState(GameSessionEntity session) {
        GameStateDTO gameStateDTO = getGameState(session.getId());
        messagingTemplate.convertAndSend("/topic/game/" + session.getId() + "/state", gameStateDTO);
    }

    // This is the original method called by the cached version
    @Transactional(propagation = Propagation.REQUIRED)
    private String generateStoryElement(GameSessionEntity session, int turnNumber) {
        try {
            // Get previous story elements for continuity
            List<Map<String, Object>> previousElements = storyPromptService.getStoryPrompts(session.getId());
            
            // Get current players and their roles
            List<PlayerSessionEntity> players = playerRepository.findBySessionId(session.getId());
            List<String> activeRoles = new ArrayList<>();
            
            for (PlayerSessionEntity player : players) {
                String roleName = player.getRole() != null ? player.getRole().getName() : "Participant";
                if (!activeRoles.contains(roleName)) {
                    activeRoles.add(roleName);
                }
            }
            
            Map<String, Object> request = new HashMap<>();
            request.put("task", "story_prompt");
            request.put("content", session.getContent().getTitle());
            request.put("contentDescription", session.getContent().getDescription());
            request.put("turn", turnNumber);
            request.put("roles", activeRoles);
            
            // HYBRID APPROACH: Role-friendly collaborative scenarios
            // Note: The detailed instructions are now in AIService.java under story_prompt case
            // We just need to pass the role information for context
            
            // Include previous story for continuity and progression
            if (!previousElements.isEmpty()) {
                List<String> previousStory = previousElements.stream()
                    .map(element -> (String) element.get("prompt"))
                    .limit(3) // Only last 3 for context
                    .collect(Collectors.toList());
                request.put("previousStory", previousStory);
                request.put("needsProgression", true);
            } else {
                request.put("needsProgression", false);
            }
            
            String newPrompt = aiService.callAIModel(request).getResult();
            
            // Clean the prompt to ensure it meets requirements
            String cleanedPrompt = cleanStoryPrompt(newPrompt);
            
            // Validate prompt ends with a question to encourage participation
            cleanedPrompt = cleanedPrompt.trim();
            if (!cleanedPrompt.endsWith("?")) {
                // If no question mark, check if it's a clear action prompt
                if (!cleanedPrompt.toLowerCase().matches(".*(what|how|where|when|should|could|would).*")) {
                    // Add a generic collaborative prompt if needed
                    if (!cleanedPrompt.endsWith(".")) {
                        cleanedPrompt += ".";
                    }
                    cleanedPrompt += " What should the team do?";
                }
            }
            
            // Save the cleaned story prompt
            storyPromptService.addStoryPrompt(session.getId(), turnNumber, cleanedPrompt);
            
            return cleanedPrompt;
        } catch (Exception e) {
            logger.error("Error generating story element for session {}: {}", session.getId(), e.getMessage(), e);
            
            // Provide content-relevant fallback with role invitation
            String contentTitle = session.getContent() != null ? session.getContent().getTitle() : "the topic";
            return "A situation unfolds regarding " + contentTitle + ". Using your role, how would you respond?";
        }
    }


    // Add this method to clean story prompts
    private String cleanStoryPrompt(String rawStory) {
        if (rawStory == null || rawStory.trim().isEmpty()) {
            return "A new situation unfolds. Using your role, how would you respond?";
        }
        
        String cleaned = rawStory.trim();
        
        // Remove markdown formatting
        cleaned = cleaned.replaceAll("\\*\\*([^*]+)\\*\\*", "$1"); // Remove **bold**
        cleaned = cleaned.replaceAll("\\*([^*]+)\\*", "$1"); // Remove *italic*
        cleaned = cleaned.replaceAll("#{1,6}\\s*", ""); // Remove headers
        cleaned = cleaned.replaceAll("Turn \\d+:", ""); // Remove "Turn X:"
        cleaned = cleaned.replaceAll("\\(([^)]+)\\)", ""); // Remove parenthetical directions
        
        // Remove player-specific references
        cleaned = cleaned.replaceAll("\\bPlayer [A-Z]\\b", "someone");
        cleaned = cleaned.replaceAll("\\bPlayer [0-9]+\\b", "someone");
        cleaned = cleaned.replaceAll("\\bPlayer [A-Z]'s\\b", "someone's");
        cleaned = cleaned.replaceAll("\\bPlayer [0-9]+'s\\b", "someone's");
        
        // Remove specific role names being used as subjects (e.g., "The villain should...")
        // But preserve "your role" and "their role" phrases
        cleaned = cleaned.replaceAll("\\bThe (villain|hero|bystander|narrator|sidekick)\\b", "Someone");
        cleaned = cleaned.replaceAll("\\bA (villain|hero|bystander|narrator|sidekick)\\b", "Someone");
        
        // Remove gender pronouns and replace with neutral alternatives
        cleaned = cleaned.replaceAll("\\bhe\\b", "they");
        cleaned = cleaned.replaceAll("\\bHe\\b", "They");
        cleaned = cleaned.replaceAll("\\bshe\\b", "they");
        cleaned = cleaned.replaceAll("\\bShe\\b", "They");
        cleaned = cleaned.replaceAll("\\bhim\\b", "them");
        cleaned = cleaned.replaceAll("\\bHim\\b", "Them");
        cleaned = cleaned.replaceAll("\\bher\\b", "them");
        cleaned = cleaned.replaceAll("\\bHer\\b", "Them");
        cleaned = cleaned.replaceAll("\\bhis\\b", "their");
        cleaned = cleaned.replaceAll("\\bHis\\b", "Their");
        cleaned = cleaned.replaceAll("\\bhers\\b", "theirs");
        cleaned = cleaned.replaceAll("\\bHers\\b", "Theirs");
        
        // Remove complex punctuation
        cleaned = cleaned.replaceAll("[\u201C\u201D\u2018\u2019\u201E\u201A]", "\""); // Normalize quotes
        cleaned = cleaned.replaceAll("…", "..."); // Normalize ellipsis
        
        // Preserve role-invitation phrases but remove other directive language
        // DON'T remove: "using your role", "from your perspective", "in your role"
        // DO remove: generic "you should", "you must" (unless followed by role context)
        if (!cleaned.toLowerCase().matches(".*you (should|must|need to).*(role|perspective).*")) {
            cleaned = cleaned.replaceAll("\\bYou should\\b", "Consider");
            cleaned = cleaned.replaceAll("\\bYou must\\b", "It's time to");
            cleaned = cleaned.replaceAll("\\bYou need to\\b", "There's a need to");
        }
        
        // Split into sentences and limit length
        String[] sentences = cleaned.split("\\. ");
        StringBuilder result = new StringBuilder();
        int sentenceCount = 0;
        
        for (String sentence : sentences) {
            if (sentenceCount >= 3) break; // Max 3 sentences
            
            sentence = sentence.trim();
            if (!sentence.isEmpty()) {
                // Allow slightly longer sentences if they contain role invitation
                String[] words = sentence.split("\\s+");
                boolean hasRoleInvitation = sentence.toLowerCase().contains("your role") || 
                                           sentence.toLowerCase().contains("your perspective");
                int maxWords = hasRoleInvitation ? 25 : 18;
                
                if (words.length <= maxWords) {
                    if (result.length() > 0) result.append(". ");
                    result.append(sentence);
                    sentenceCount++;
                }
            }
        }
        
        String finalStory = result.toString().trim();
        
        // Ensure it ends with proper punctuation
        if (!finalStory.endsWith(".") && !finalStory.endsWith("?") && !finalStory.endsWith("!")) {
            finalStory += ".";
        }
        
        // If still too long, provide a simple fallback with role invitation
        if (finalStory.length() > 250) {
            return "The story continues. Using your role, how would you respond?";
        }
        
        // If the story is too short or unclear, provide a better fallback
        if (finalStory.length() < 20 || finalStory.split("\\s+").length < 4) {
            return "A new situation unfolds. Using your role, what would you do?";
        }
        
        return finalStory;
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
        
        // Reset timer immediately
        gameState.setStatus(GameState.Status.TURN_IN_PROGRESS);
        gameState.setLastTurnTime(System.currentTimeMillis()); // Use current time for accuracy
        
        // Send immediate timer update with full time
        Map<String, Object> initialTimerUpdate = new HashMap<>();
        initialTimerUpdate.put("timeRemaining", gameState.getTimePerTurn());
        initialTimerUpdate.put("timestamp", System.currentTimeMillis());
        initialTimerUpdate.put("reset", true); // Flag to indicate timer reset
        
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/timer", initialTimerUpdate);

        // Remove automatic story generation here - only generate at cycle boundaries
        // Only broadcast existing story prompt, don't generate new one
        if (gameState.getStoryPrompt() != null) {
            Map<String, Object> storyUpdate = new HashMap<>();
            storyUpdate.put("type", "storyRefresh");
            storyUpdate.put("content", gameState.getStoryPrompt());
            messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", storyUpdate);
        }

        broadcastTurnUpdate(sessionId, gameState, session);
        logger.info("Turn {} started for player {} in session {}", gameState.getCurrentTurn(), 
                    session.getCurrentPlayer().getId(), sessionId);
    }

    // Method to broadcast turn updates, can be customized further
    private void broadcastTurnUpdate(Long sessionId, GameState gameState, GameSessionEntity session) {
        if (session.getCurrentPlayer() == null) {
            logger.warn("Cannot broadcast turn update for session {} as current player is null.", sessionId);
            return;
        }
        TurnInfoDTO turnInfo = new TurnInfoDTO();
        turnInfo.setTurnNumber(gameState.getCurrentTurn());
        turnInfo.setPlayerId(session.getCurrentPlayer().getId());
        turnInfo.setPlayerName(session.getCurrentPlayer().getUser().getFname() + " " + session.getCurrentPlayer().getUser().getLname());
        turnInfo.setTimeRemaining(gameState.getTimePerTurn());
        if (session.getCurrentPlayer().getRole() != null) {
            turnInfo.setRoleName(session.getCurrentPlayer().getRole().getName());
        }
        // turnInfo.setWordBomb(currentPlayer.getCurrentWordBomb()); // If using word bombs

        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/turn", turnInfo);
        logger.info("Turn update broadcasted for session {}: Turn {}, Player {}", sessionId, gameState.getCurrentTurn(), session.getCurrentPlayer().getId());
    }

    /**
     * Get or generate comprehension questions for a session (with proper caching)
     * This ensures ALL players get the SAME questions
     */
    public List<Map<String, Object>> getOrGenerateComprehensionQuestions(Long sessionId) {
        logger.info("Getting comprehension questions for session {}", sessionId);
        
        // This will use the session-level cache in ComprehensionCheckService
        // Always pass null for studentId to ensure session-wide questions
        List<Map<String, Object>> questions = comprehensionCheckService.generateComprehensionQuestions(sessionId, null);
        
        logger.info("Retrieved {} comprehension questions for session {}", questions.size(), sessionId);
        return questions;
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

        // Use active player lookup
        List<PlayerSessionEntity> userPlayers = playerRepository.findActiveBySessionIdAndUserId(sessionId, userId);
        if (userPlayers.isEmpty()) {
            logger.warn("Submit word failed - user {} not found as active player in session {}", userId, sessionId);
            return false;
        }
        
        PlayerSessionEntity userPlayer = userPlayers.get(0);
        PlayerSessionEntity currentPlayer = playerRepository.findById(gameState.getCurrentPlayerId())
                .orElseThrow(() -> {
                    logger.error("Current player not found for game state with player ID {}",
                            gameState.getCurrentPlayerId());
                    return new RuntimeException("Current player not found");
                });
        if (!Long.valueOf(currentPlayer.getUser().getId()).equals(userId)) { // Corrected ID comparison
            logger.warn("Submit word failed - it's not user {}'s turn (current player: {})",
                    userId, currentPlayer.getUser().getId());
            return false;
        }

        if (submission.getWord().trim().length() < 5) {
            logger.warn("Submit word failed - submission too short: {}", submission.getWord());
            return false;
        }

        String lowercaseWord = submission.getWord().toLowerCase();
        if (gameState.getUsedWords().contains(lowercaseWord)) {
            logger.warn("Submit word failed - word '{}' has already been used in session {}",
                    lowercaseWord, sessionId);
            return false;
        }

        logger.debug("Adding word '{}' to used words list for session {}", lowercaseWord, sessionId);
        // gameState.getUsedWords().add(lowercaseWord); // This line will be covered by the logic below
        
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found"));
        List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(
            session.getContent().getContentData());
        List<String> usedWordsFromBank = wordDetectionService.detectWordBankUsage(
            submission.getWord(), wordBankItems);
        if (!usedWordsFromBank.isEmpty()) {
            gameState.getUsedWords().addAll(usedWordsFromBank);
        } else {
             gameState.getUsedWords().add(lowercaseWord); // Add the submission itself if no bank words found in it
        }

        try {
            // Pause timer while synchronous processing occurs (multiplayer path)
            eventPublisher.publishEvent(new TimerPauseEvent(sessionId));
            logger.debug("Sending word via chat service for session {}", sessionId);
            ChatMessageEntity message = chatService.sendMessage(sessionId, userId, submission.getWord());
            boolean wasExceptional = false;
            if (message.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT) {
                if (message.getWordUsed() != null && !message.getWordUsed().isEmpty()) {
                    scoreService.handleExceptionalContribution(sessionId, userId, submission.getWord());
                    wasExceptional = true;
                }
            }
            
            if (wasExceptional) {
                Map<String, Object> exceptionalNotice = new HashMap<>();
                exceptionalNotice.put("type", "exceptionalContribution");
                exceptionalNotice.put("playerName", currentPlayer.getUser().getFname() + " " +
                                     currentPlayer.getUser().getLname());
                exceptionalNotice.put("message", submission.getWord());
                
                messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates",
                                               exceptionalNotice);
            }
            // Resume timer after processing completes
            eventPublisher.publishEvent(new TimerResumeEvent(sessionId));
        } catch (Exception e) {
            logger.error("Error sending word via chat service for session {}: {}", sessionId, e.getMessage(), e);
            eventPublisher.publishEvent(new TimerResumeEvent(sessionId));
            return false;
        }
        trackTurnCompletion(currentPlayer, session);
        logger.info("Successfully processed word submission '{}' for session {} by user {}, advancing to next player",
                submission.getWord(), sessionId, userId);
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
            session.setCurrentCycle(upcomingTurnGlobal);
            gameState.setCurrentCycle(upcomingTurnGlobal);
            logger.info("Session {} (Single Player): Advanced to Turn/Cycle {}", sessionId, upcomingTurnGlobal);
        } else {
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
                
                generateAndBroadcastNewStoryPrompt(sessionId, session, gameState, upcomingTurnGlobal);
                
                // Clear used words for new cycle
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
        
        selectNextPlayer(session);
        gameSessionRepository.save(session);

        startNextTurn(sessionId);
    }

    private void generateAndBroadcastNewStoryPrompt(Long sessionId, GameSessionEntity session, 
                                                  GameState gameState, int turnNumber) {
        try {
            String newStoryElement = generateStoryElementCached(session, turnNumber);
            gameState.setStoryPrompt(newStoryElement);
            
            Map<String, Object> storyUpdate = new HashMap<>();
            storyUpdate.put("type", "storyUpdate");
            storyUpdate.put("content", newStoryElement);
            storyUpdate.put("turnNumber", turnNumber);
            
            messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/updates", storyUpdate);
            logger.info("New story prompt generated for session {} at turn {}", sessionId, turnNumber);
        } catch (Exception e) {
            logger.error("Error generating new story prompt for session {}: {}", sessionId, e.getMessage());
        }
    }

    private double calculateTurnCompletionRate(StudentProgress progress, GameSessionEntity session) {
        if (session.getTotalTurns() <= 0) return 0;
        return Math.min(100.0, (progress.getTotalTurnsTaken() * 100.0) / session.getTotalTurns());
    }

    public void endGame(Long sessionId) {
        GameState gameState = activeGames.get(sessionId);
        if (gameState == null) {
            GameSessionEntity sessionCheck = gameSessionRepository.findById(sessionId).orElse(null);
            if (sessionCheck != null && sessionCheck.getStatus() != GameSessionEntity.SessionStatus.COMPLETED) {
                sessionCheck.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
                sessionCheck.setEndedAt(new Date());
                gameSessionRepository.save(sessionCheck);
                logger.info("Game session {} marked as COMPLETED", sessionId);
            }
            return;
        }

        if (gameState.getStatus() == GameState.Status.COMPLETED) {
            logger.info("Game {} already ended.", sessionId);
            activeGames.remove(sessionId);
            // Clear comprehension cache when game ends
            comprehensionCheckService.clearSessionQuestionsCache(sessionId);
            return;
        }

        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        session.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
        session.setEndedAt(new Date());
        gameSessionRepository.save(session);

        gameState.setStatus(GameState.Status.COMPLETED);
        Map<String, Object> endMessage = new HashMap<>();
        endMessage.put("event", "gameEnded");
        endMessage.put("sessionId", sessionId);
        endMessage.put("leaderboard", getSessionLeaderboard(sessionId));
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/status", endMessage);

        gameResultService.processEndGameResults(sessionId);
        activeGames.remove(sessionId);
        
        // Clear comprehension cache when game ends
        comprehensionCheckService.clearSessionQuestionsCache(sessionId);
        
        logger.info("Game {} ended and caches cleared.", sessionId);
    }

    @Transactional
    public void joinGame(Long sessionId, Long userId) {
        logger.info("Player {} joining game {}", userId, sessionId);
        List<PlayerSessionDTO> playerDTOs = gameSessionService.getSessionPlayerDTOs(sessionId);
        
        logger.info("Found {} players in session", playerDTOs.size());
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/players", playerDTOs);
    }
    
    @Transactional(readOnly = true)
    public List<PlayerSessionDTO> getSessionPlayerList(Long sessionId) {
        return gameSessionService.getSessionPlayerDTOs(sessionId);
    }

    private List<WordBankItemDTO> enrichWordBankItems(List<WordBankItem> wordBankItems) {
        return wordBankItems.stream()
                .map(item -> {
                    if (item.getDescription() == null || item.getExampleUsage() == null) {
                        try {
                            Map<String, Object> request = new HashMap<>();
                            request.put("task", "word_enrichment");
                            request.put("word", item.getWord());

                            AIService.AIResponse response = aiService.callAIModel(request);
                            String[] parts = response.getResult().split("\\|");

                            if (parts.length == 2) {
                                String description = parts[0].trim();
                                String exampleUsage = parts[1].trim();

                                // Update the entity
                                item.setDescription(description);
                                item.setExampleUsage(exampleUsage);
                                wordBankRepository.save(item);

                                return new WordBankItemDTO(item.getId(), item.getWord(), description, exampleUsage);
                            }
                        } catch (Exception e) {
                            logger.error("Error enriching word bank item {}: {}", item.getWord(), e.getMessage());
                        }
                    }
                    return new WordBankItemDTO(item.getId(), item.getWord(),
                            item.getDescription(), item.getExampleUsage());
                })
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
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
            if (session.getContent() != null && session.getContent().getContentData() != null) {
                List<WordBankItem> wordBankItems = wordBankRepository.findByContentData(session.getContent().getContentData());
                List<WordBankItemDTO> wordBankDTOs = enrichWordBankItems(wordBankItems);
                dto.setWordBank(wordBankDTOs);
            }
        }
        // Add player cards to game state

        
        dto.setLeaderboard(scoreService.getSessionLeaderboard(sessionId));
        dto.setTimePerTurn(session.getTimePerTurn());
        dto.setTotalTurns(session.getTotalTurns());
        dto.setCurrentTurn(session.getCurrentTurn());
        dto.setCurrentCycle(session.getCurrentCycle());

        GameState activeGameState = activeGames.get(sessionId);
        if (activeGameState != null) {
            dto.setStatus(activeGameState.getStatus().toString());
            int remaining;
            if (activeGameState.paused) {
                remaining = activeGameState.pausedRemainingTime;
            } else {
                remaining = activeGameState.getTimePerTurn() - (int)((System.currentTimeMillis() - activeGameState.getLastTurnTime()) / 1000);
            }
            dto.setTimeRemaining(remaining);
            dto.setPaused(activeGameState.paused);
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
                currentPlayerMap.put("id", currentPlayerEntity.getId());
                currentPlayerMap.put("userId", currentPlayerEntity.getUser().getId());
                currentPlayerMap.put("name", currentPlayerEntity.getUser().getFname() + " " + currentPlayerEntity.getUser().getLname());
                if (currentPlayerEntity.getRole() != null) {
                    currentPlayerMap.put("role", currentPlayerEntity.getRole().getName());
                }
                // Include profile picture in the lightweight currentPlayer map so the
                // frontend turn indicator can always display the avatar without doing
                // an extra lookup in players[]. This is a small string (URL / base64)
                // and does not materially impact payload size compared to existing
                // per-turn data.
                if (currentPlayerEntity.getUser() != null) {
                    currentPlayerMap.put("profilePicture", currentPlayerEntity.getUser().getProfilePicture());
                }
                dto.setCurrentPlayer(currentPlayerMap);
            }
        } else {
             dto.setTimeRemaining(0);
             if (session.getStatus() == GameSessionEntity.SessionStatus.COMPLETED) {
                 dto.setStoryPrompt("The game has ended.");
             }
        }
        
        if (session.getContent() != null && session.getContent().getGameConfig() != null) {
            dto.setTurnCyclesConfig(session.getContent().getGameConfig().getTurnCycles());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSessionLeaderboard(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Game session not found for leaderboard: " + sessionId));
        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId);
        
        return players.stream().map(p -> {
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("id", p.getId());
            playerData.put("userId", p.getUser().getId());
            playerData.put("name", p.getUser().getFname() + " " + p.getUser().getLname());
            playerData.put("score", p.getTotalScore());
            playerData.put("role", p.getRole() != null ? p.getRole().getName() : null);
            playerData.put("profilePicture", p.getUser().getProfilePicture());
            return playerData;
        }).sorted(Comparator.<Map<String, Object>>comparingInt(p -> (Integer) p.get("score")).reversed())
          .collect(Collectors.toList());
    }

    // Optimized timer checking - reduce frequency for single player
    @Scheduled(fixedRate = 1000) // Back to 1 second for better timer accuracy
    @Transactional(propagation = Propagation.REQUIRED)
    public void checkTurnTimersOptimized() {
        long currentTime = System.currentTimeMillis();
        List<Long> sessionsToRemove = new ArrayList<>();
        
        activeGames.forEach((sessionId, gameState) -> {
            try {
                if (gameState.getStatus() == GameState.Status.TURN_IN_PROGRESS) {
                    if (gameState.paused) {
                        // Periodically rebroadcast paused remaining time to keep clients synced
                        Map<String,Object> pausedUpdate = new HashMap<>();
                        pausedUpdate.put("timeRemaining", gameState.pausedRemainingTime);
                        pausedUpdate.put("timestamp", currentTime);
                        pausedUpdate.put("paused", true);
                        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/timer", pausedUpdate);
                        return; // Skip countdown while paused
                    }
                    GameSessionEntity session = gameSessionRepository.findById(sessionId).orElse(null);
                    if (session == null) {
                        logger.warn("Timer check: Session {} not found, removing from active games.", sessionId);
                        sessionsToRemove.add(sessionId);
                        return;
                    }

                    boolean isSinglePlayer = session.getPlayers().size() == 1;
                    long turnStartTimeMs = gameState.getLastTurnTime();
                    int timePerTurnSec = gameState.getTimePerTurn();
                    long elapsedSec = (currentTime - turnStartTimeMs) / 1000;
                    int timeRemaining = timePerTurnSec - (int) elapsedSec;
                    
                    // Always update timer for consistency
                    Map<String, Object> timerUpdate = new HashMap<>();
                    timerUpdate.put("timeRemaining", Math.max(0, timeRemaining));
                    timerUpdate.put("timestamp", currentTime);
                    timerUpdate.put("paused", false);
                    
                    // Send timer updates more frequently when time is running low
                    boolean shouldSendUpdate = timeRemaining <= 10 || // Always send when low
                                         timeRemaining % (isSinglePlayer ? 2 : 1) == 0; // Every 2s for single, 1s for multi
                
                    if (shouldSendUpdate) {
                        messagingTemplate.convertAndSend(
                            "/topic/game/" + sessionId + "/timer",
                            timerUpdate
                        );
                    }
                    
                    if (timeRemaining <= 0) {
                        if (isSinglePlayer) {
                            logger.info("Time up for single player in session {}. Advancing turn.", sessionId);
                            handleSinglePlayerTurnAdvancement(sessionId);
                        } else {
                            logger.info("Time up for player {} in session {}. Advancing turn.", 
                                      gameState.getCurrentPlayerId(), sessionId);
                            
                            // Award penalty points
                            PlayerSessionEntity player = playerRepository.findById(gameState.getCurrentPlayerId()).orElse(null);
                            if (player != null) {
                                awardPoints(sessionId, player.getUser().getId(), -5, "Missed turn");
                            }
                            advanceToNextPlayer(sessionId);
                        }
                    }
                }
            } catch (Exception e) {
                logger.error("Error in timer check for session " + sessionId, e);
            }
        });
        
        // Clean up invalid sessions
        sessionsToRemove.forEach(activeGames::remove);
    }

    @Transactional
    private void awardPoints(Long sessionId, Long userId, int points, String reason) {
        scoreService.awardPoints(sessionId, userId, points, reason);

        Map<String, Object> scoreUpdate = new HashMap<>();
        scoreUpdate.put("points", points);
        scoreUpdate.put("reason", reason);
        
        PlayerSessionEntity playerSession = playerRepository.findBySessionIdAndUserId(sessionId, userId).stream().findFirst().orElse(null);
        if (playerSession != null) {
            scoreUpdate.put("totalScore", playerSession.getTotalScore());
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getEmail() != null) {
             messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/score", scoreUpdate);
        }
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/scores", getSessionLeaderboard(sessionId));
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
        private List<String> usedWords = new ArrayList<>();
        private Map<String, Object> contentInfo;
        private int currentCycle;
        private String storyPrompt;
        private int configuredTurnCycles;
        private boolean paused;
        private int pausedRemainingTime;

        enum Status {
            WAITING_TO_START,
            WAITING_FOR_PLAYER,
            TURN_IN_PROGRESS,
            COMPLETED
        }

        // Getters and Setters
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
        public boolean isPaused() { return paused; }
        public void setPaused(boolean paused) { this.paused = paused; }
        public int getPausedRemainingTime() { return pausedRemainingTime; }
        public void setPausedRemainingTime(int pausedRemainingTime) { this.pausedRemainingTime = pausedRemainingTime; }
    }
}