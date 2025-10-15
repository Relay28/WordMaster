package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.ComprehensionCheckService;
import cit.edu.wrdmstr.service.StoryPromptService;
import cit.edu.wrdmstr.dto.GameSessionDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameSessionService {
    private static final Logger logger = LoggerFactory.getLogger(GameSessionService.class);

    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private ContentRepository contentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private ClassroomRepository classroomRepository;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private AIService aiService;
    @Autowired private ChatMessageEntityRepository chatmessageRepository;
    @Autowired private TeacherFeedbackRepository teacherfeedbackRepository;
    @Autowired private ComprehensionCheckService comprehensionCheckService;
    @Autowired private GrammarResultRepository grammarResultRepository;
    @Autowired private VocabularyResultRepository vocabularyResultRepository;
    @Autowired private ComprehensionResultRepository comprehensionResultRepository;
    @Autowired private PlayerCardRepository playerCardRepository;
    
    // Add this field
    @Autowired @Lazy
    private GameSessionManagerService gameSessionManagerService;

    @Autowired private StoryPromptService storyPromptService;


    public GameSessionEntity createSession(Long contentId, Authentication auth) {
        String email = auth.getName();
        UserEntity teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
    
        ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
    
        // Verify teacher can access this content
        if (!(content.getCreator().getId() == teacher.getId()) &&
        (content.getClassroom() == null || !(content.getClassroom().getTeacher().getId() == teacher.getId()))) {
            throw new AccessDeniedException("You don't have permission to create a game with this content");
        }

        GameSessionEntity session = new GameSessionEntity();
        session.setContent(content);
        session.setTeacher(teacher);
        session.setSessionCode(generateSessionCode());
        session.setStatus(GameSessionEntity.SessionStatus.PENDING);
        
        // Save the session first
        GameSessionEntity savedSession = gameSessionRepository.save(session);
        
        // Clear any automatic player entries that might have been created
        List<PlayerSessionEntity> defaultPlayers = playerSessionRepository.findBySessionId(savedSession.getId());
        if (!defaultPlayers.isEmpty()) {
            playerSessionRepository.deleteAll(defaultPlayers);
        }
        
        return savedSession;
    }
    public List<GameSessionEntity> getSessionsByStudentId(Long studentId) {
        return gameSessionRepository.findSessionsByPlayerId(studentId);
    }

    @Transactional
    public List<Map<String, Object>> getActiveSessionsWithDetails(Long contentId) {
        List<GameSessionEntity> activeSessions = gameSessionRepository.findActiveSessionsByContent(contentId);

        return activeSessions.stream().map(session -> {
            Map<String, Object> sessionDetails = new HashMap<>();
            sessionDetails.put("sessionId", session.getId());
            sessionDetails.put("sessionCode", session.getSessionCode());
            sessionDetails.put("status", session.getStatus().toString());
            sessionDetails.put("startedAt", session.getStartedAt());

            // Include players
            List<PlayerSessionDTO> players = getSessionPlayerDTOs(session.getId());
            sessionDetails.put("players", players);

            // Include leaderboard
            List<Map<String, Object>> leaderboard = getSessionLeaderboard(session.getId());
            sessionDetails.put("leaderboard", leaderboard);

            return sessionDetails;
        }).collect(Collectors.toList());
    }


    private List<Map<String, Object>> getSessionLeaderboard(Long sessionId) {
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);

        return players.stream().map(player -> {
                    Map<String, Object> playerData = new HashMap<>();
                    playerData.put("id", player.getId());
                    playerData.put("userId", player.getUser().getId());
                    playerData.put("name", player.getUser().getFname() + " " + player.getUser().getLname());
                    playerData.put("score", player.getTotalScore());
                    playerData.put("role", player.getRole() != null ? player.getRole().getName() : null);
                    playerData.put("profilePicture", player.getUser().getProfilePicture());
                    return playerData;
                }).sorted(Comparator.comparingInt(player -> (int) ((Map<String, Object>) player).get("score")).reversed())
                .collect(Collectors.toList());
    }
    public UserEntity getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserEntity::getId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
    
    public GameSessionEntity startSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
            
        if (session.getStatus() != GameSessionEntity.SessionStatus.PENDING) {
            throw new IllegalStateException("Game is not in PENDING state");
        }
        
        session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
        session.setStartedAt(new Date());
        return gameSessionRepository.save(session);
    }

    private String generateSessionCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder code = new StringBuilder();
        Random rnd = new Random();
        
        // Generate 6 character code
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        
        // Make sure code is unique
        while (gameSessionRepository.findBySessionCode(code.toString()).isPresent()) {
            code = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                code.append(chars.charAt(rnd.nextInt(chars.length())));
            }
        }
        
        return code.toString();
    }

    public List<GameSessionEntity> getSessionsByTeacherAndContent(Long teacherId, Long contentId) {
        return gameSessionRepository.findByContentId( contentId);
    }

    // Add this method
    public PlayerSessionDTO convertToDTO(PlayerSessionEntity entity) {
        if (entity == null) return null;
        PlayerSessionDTO dto = new PlayerSessionDTO();
        dto.setId(entity.getId());
        
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            String fname = entity.getUser().getFname() != null ? entity.getUser().getFname() : "";
            String lname = entity.getUser().getLname() != null ? entity.getUser().getLname() : "";
            dto.setName((fname + " " + lname).trim()); // <-- Use setName, not setPlayerName
        }
        
        if (entity.getRole() != null) {
            dto.setGameRole(entity.getRole().getName()); // Use gameRole for the session-specific role
            
            // If user's system role isn't set yet, use the game role for the role field too
            if (entity.getUser() != null && entity.getUser().getRole() == null) {
                dto.setRole(entity.getRole().getName());
            }
        }
        
        // Set the user's system role if available
        if (entity.getUser() != null && entity.getUser().getRole() != null) {
            String role = entity.getUser().getRole();
            if (role.startsWith("USER_")) {
                role = role.substring(5); // Remove "USER_" prefix
            }
            role = role.substring(0, 1).toUpperCase() + role.substring(1).toLowerCase();
            dto.setRole(role);
        }
        
        dto.setTotalScore(entity.getTotalScore());
        dto.setActive(entity.isActive());
        
        return dto;
    }

    public List<PlayerSessionDTO> getSessionPlayerDTOs(Long sessionId) {
        GameSessionEntity session = getSessionById(sessionId);
        List<PlayerSessionEntity> players = session.getPlayers();

        return players.stream().map(player -> {
            PlayerSessionDTO dto = new PlayerSessionDTO();
            dto.setId(player.getId());
            dto.setUserId(player.getUser().getId());

            // Use first and last name instead of username
            String fname = player.getUser().getFname() != null ? player.getUser().getFname() : "";
            String lname = player.getUser().getLname() != null ? player.getUser().getLname() : "";
            String fullName = (fname + " " + lname).trim();

            // If name is empty after trimming, use a fallback
            if (fullName.isEmpty()) {
                fullName = "Student"; // Fallback name
            }

            dto.setPlayerName(fullName);

            // Format role to be more user-friendly
            String role = player.getUser().getRole();
            if (role != null) {
                // Convert USER_STUDENT to Student, USER_TEACHER to Teacher, etc.
                if (role.startsWith("USER_")) {
                    role = role.substring(5); // Remove "USER_" prefix
                }
                role = role.substring(0, 1).toUpperCase() + role.substring(1).toLowerCase();
            } else {
                role = "Student"; // Default role
            }
            dto.setRole(role);
            
            // Set the game role if available (from the player's role in the session)
            if (player.getRole() != null) {
                dto.setGameRole(player.getRole().getName());
            }

            // Set profile picture
            if (player.getUser().getProfilePicture() != null) {
                dto.setProfilePicture(player.getUser().getProfilePicture());
            }

            // Set other fields as needed
            dto.setTotalScore(player.getTotalScore());
            dto.setActive(player.isActive());

            return dto;
        }).collect(Collectors.toList());
    }

    public GameSessionEntity getSessionById(Long sessionId) {
        return gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
    }

    public GameSessionEntity getSessionByCode(String code) {
        return gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));
    }
    
    public void verifyTeacherAccess(Long sessionId, Authentication auth) {
        String email = auth.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
        
                if (!(session.getTeacher().getId() == user.getId())) {
                    throw new AccessDeniedException("Only the teacher who created this game can perform this action");
                }
    }

    public List<GameSessionEntity> getSessionsByClassroom(Long classroomId) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        
        List<GameSessionEntity> sessions = new ArrayList<>();
        classroom.getContents().forEach(content -> {
            sessions.addAll(gameSessionRepository.findByContentId(content.getId()));
        });
        
        return sessions;
    }

    public List<PlayerSessionEntity> getSessionPlayers(Long sessionId) {
        return playerSessionRepository.findBySessionId(sessionId);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
        
        // Clear story prompts
        storyPromptService.clearStoryPrompts(sessionId);
        
        // Break the circular reference first  
        session.setCurrentPlayer(null);
        gameSessionRepository.save(session);

        // Get all player session IDs for this game session
        List<PlayerSessionEntity> playerSessions = playerSessionRepository.findBySessionId(sessionId);
        List<Long> playerSessionIds = playerSessions.stream()
            .map(PlayerSessionEntity::getId)
            .collect(Collectors.toList());
        
        // Delete all player cards first to avoid foreign key constraints
        if (!playerSessionIds.isEmpty()) {
            playerCardRepository.deleteByPlayerSessionIds(playerSessionIds);
        }

        // Delete all player sessions
        playerSessionRepository.deleteBySessionId(sessionId);
        
        // Delete all messages associated with this session
        chatmessageRepository.deleteBySessionId(sessionId);
        
        // Delete all feedback for this session
        teacherfeedbackRepository.deleteByGameSessionId(sessionId);

        // Delete all grammar results for this session
        grammarResultRepository.deleteByGameSessionId(sessionId);

        // Delete all vocabulary results for this session
        vocabularyResultRepository.deleteByGameSessionId(sessionId);

        // Delete all comprehension results for this session
        comprehensionResultRepository.deleteByGameSessionId(sessionId);
        
        // Finally delete the session itself
        gameSessionRepository.delete(session);
    }

    // Ensure joinSession and other methods are correctly implemented
    // For example, the joinSession method provided in context:
    @Transactional
    public synchronized PlayerSessionEntity joinSession(Long sessionId, Long userId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (session.getTeacher() != null && session.getTeacher().getId() == userId) {
            throw new IllegalStateException("Teacher cannot join the session as a player.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check for existing active player sessions first
        List<PlayerSessionEntity> existingPlayers = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        
        // Filter for active players only
        List<PlayerSessionEntity> activePlayers = existingPlayers.stream()
                .filter(PlayerSessionEntity::isActive)
                .collect(Collectors.toList());
        
        if (!activePlayers.isEmpty()) {
            // Return the existing active player
            logger.info("User {} already has an active session in game {}", userId, sessionId);
            return activePlayers.get(0);
        }
        
        // Deactivate any inactive duplicate entries
        if (!existingPlayers.isEmpty()) {
            for (PlayerSessionEntity inactive : existingPlayers) {
                if (!inactive.isActive()) {
                    continue; // Already inactive
                }
                inactive.setActive(false);
                playerSessionRepository.save(inactive);
            }
        }

        // Create new player session
        PlayerSessionEntity playerSession = new PlayerSessionEntity();
        playerSession.setSession(session);
        playerSession.setUser(user);
        playerSession.setActive(true);
        playerSession.setTotalScore(0);
        playerSession.setGrammarStreak(0);

        PlayerSessionEntity savedPlayer = playerSessionRepository.save(playerSession);
        
        // Draw cards for the player after successful join
//        try {
//            // First ensure cards exist for the content
//            cardService.generateCardsForContent(session.getContent().getId());
//            // Then draw cards for the player
//            cardService.drawCardsForPlayer(savedPlayer.getId());
//        } catch (Exception e) {
//            logger.error("Failed to draw cards for player {} in session {}: {}",
//                        userId, sessionId, e.getMessage());
//        }

        return playerSessionRepository.save(playerSession);
    }

    @Transactional
    public GameSessionEntity endSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
        
        session.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
        session.setEndedAt(new Date());
        return gameSessionRepository.save(session);
    }

    /**
     * End a game session and optionally generate comprehension questions for all participants
     */
    @Transactional
    public Map<String, Object> endSessionWithComprehension(Long sessionId, boolean generateComprehension) {
        // End the session
        GameSessionEntity session = endSession(sessionId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", "completed");
        result.put("sessionId", sessionId);
        
        // If comprehension check requested, PRE-GENERATE questions for the session
        if (generateComprehension) {
            try {
                logger.info("Pre-generating comprehension questions for session {}", sessionId);
                
                // PRE-GENERATE the questions using the manager service
                // This ensures they're cached BEFORE any player tries to access them
                List<Map<String, Object>> sessionQuestions = 
                    gameSessionManagerService.getOrGenerateComprehensionQuestions(sessionId);
                
                if (sessionQuestions != null && !sessionQuestions.isEmpty()) {
                    logger.info("Successfully pre-generated {} questions for session {}", sessionQuestions.size(), sessionId);
                    
                    // Get all players for assignment
                    List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
                    Map<Long, List<Map<String, Object>>> playerQuestions = new HashMap<>();
                    
                    // Assign the SAME pre-generated questions to ALL players
                    for (PlayerSessionEntity player : players) {
                        try {
                            Long studentId = player.getUser().getId();
                            playerQuestions.put(studentId, sessionQuestions);
                            logger.info("Assigned PRE-GENERATED questions to player {} in session {}", studentId, sessionId);
                                  
                        } catch (Exception e) {
                            logger.error("Error assigning questions to player {} in session {}: {}",
                                player.getUser().getId(), sessionId, e.getMessage(), e);
                        }
                    }
                    
                    result.put("comprehensionQuestions", playerQuestions);
                    result.put("questionsGenerated", true);
                    logger.info("Successfully assigned IDENTICAL comprehension questions to {} players in session {}", 
                               playerQuestions.size(), sessionId);
                } else {
                    logger.warn("No comprehension questions were generated for session {}", sessionId);
                    result.put("questionsGenerated", false);
                }
                       
            } catch (Exception e) {
                logger.error("Error pre-generating session comprehension questions for session {}: {}", 
                            sessionId, e.getMessage(), e);
                result.put("questionsGenerated", false);
            }
        }
        
        return result;
    }

    public List<GameSessionEntity> getActiveGames() {
        return gameSessionRepository.findByStatus(GameSessionEntity.SessionStatus.ACTIVE);
    }

    public List<GameSessionEntity> getSessionsByTeacher(Long teacherId) {
        return gameSessionRepository.findByTeacherId(teacherId);
    }

    public List<GameSessionEntity> getSessionsByStudent(Long studentId) {
        return gameSessionRepository.findSessionsByPlayerId(studentId);
    }

    @Transactional
    public List<Map<String, Object>> assignWordBombs(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
            
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
        
        // Get content for this session
        ContentEntity content = session.getContent();
        List<WordBankItem> wordBank = wordBankItemRepository.findByContentData(content.getContentData());
        
        if (wordBank.isEmpty()) {
            throw new IllegalStateException("No words available in word bank");
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        Random random = new Random();
        
        for (PlayerSessionEntity player : players) {
            String newWord;
            
            // Use AI to generate contextual word bomb if player has a role
            if (player.getRole() != null) {
                try {
                    String roleName = player.getRole().getName();
                    String contentContext = content.getDescription();
                    String difficulty = determinePlayerDifficulty(player); // New helper method
                    
                    newWord = aiService.generateWordBomb(difficulty, 
                        "Role: " + roleName + ", Context: " + contentContext);
                    
                    // Fallback if AI fails to generate a good word
                    if (newWord == null || newWord.trim().isEmpty()) {
                        newWord = wordBank.get(random.nextInt(wordBank.size())).getWord();
                    }
                } catch (Exception e) {
                    // Fallback to random selection if AI fails
                    newWord = wordBank.get(random.nextInt(wordBank.size())).getWord();
                }
            } else {
                // Fallback to random selection from word bank
                newWord = wordBank.get(random.nextInt(wordBank.size())).getWord();
            }
            
            player.setCurrentWordBomb(newWord);
            player.setWordBombUsed(false);
            playerSessionRepository.save(player);
            
            Map<String, Object> playerData = new HashMap<>();
            playerData.put("playerId", player.getUser().getId());
            playerData.put("name", player.getUser().getFname() + " " + player.getUser().getLname());
            playerData.put("wordBomb", newWord);
            result.add(playerData);
        }
        
        return result;
    }

    // Helper method to determine difficulty based on player performance
    private String determinePlayerDifficulty(PlayerSessionEntity player) {
        int score = player.getTotalScore();
        
        if (score > 50) {
            return "hard";
        } else if (score > 20) {
            return "medium";
        } else {
            return "easy";
        }
    }

    public GameSessionDTO toDTO(GameSessionEntity entity) {
        if (entity == null) return null;
        GameSessionDTO dto = new GameSessionDTO();
        dto.setId(entity.getId());
        dto.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        dto.setSessionCode(entity.getSessionCode());
        dto.setStartedAt(entity.getStartedAt());
        dto.setEndedAt(entity.getEndedAt());
        dto.setPlayerCount(entity.getPlayers() != null ? entity.getPlayers().size() : 0);

        if (entity.getContent() != null) {
            dto.setContentId(entity.getContent().getId());
            dto.setContentTitle(entity.getContent().getTitle());
        }
        if (entity.getTeacher() != null) {
            dto.setTeacherId(entity.getTeacher().getId());
            String fname = entity.getTeacher().getFname() != null ? entity.getTeacher().getFname() : "";
            String lname = entity.getTeacher().getLname() != null ? entity.getTeacher().getLname() : "";
            dto.setTeacherName((fname + " " + lname).trim());
        }
        return dto;
    }
}