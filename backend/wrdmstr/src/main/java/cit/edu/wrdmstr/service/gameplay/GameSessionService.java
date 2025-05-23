package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.service.ComprehensionCheckService;
import cit.edu.wrdmstr.dto.GameSessionDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
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
            dto.setRole(entity.getRole().getName());
        }
        
        dto.setTotalScore(entity.getTotalScore());
        dto.setActive(entity.isActive());
        
        return dto;
    }

    public List<PlayerSessionDTO> getSessionPlayerDTOs(Long sessionId) {
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
        return players.stream().map(playerEntity -> {
            PlayerSessionDTO dto = new PlayerSessionDTO();
            dto.setId(playerEntity.getId());
            
            UserEntity user = playerEntity.getUser();
            if (user != null) {
                dto.setUserId(user.getId());
                dto.setName(user.getFname() + " " + user.getLname()); // Or however player name is determined
            } else {
                dto.setName("Unknown Player"); // Fallback
            }
            
            Role playerRole = playerEntity.getRole();
            if (playerRole != null) {
                dto.setRole(playerRole.getName()); // Ensure role NAME is set
            } else {
                dto.setRole(null); // Or a default like "Participant" if preferred
            }
            
            dto.setTotalScore(playerEntity.getTotalScore());
            dto.setActive(playerEntity.isActive());
            // Map other necessary fields from PlayerSessionEntity to PlayerSessionDTO
            
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
        
        // Break the circular reference first  
        session.setCurrentPlayer(null);
        gameSessionRepository.save(session);

        // Delete all player sessions first to avoid foreign key constraints
        playerSessionRepository.deleteBySessionId(sessionId);
        
        // Delete all messages associated with this session
        chatmessageRepository.deleteBySessionId(sessionId);
        
        // Delete all feedback for this session
        teacherfeedbackRepository.deleteByGameSessionId(sessionId);
        
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

        List<PlayerSessionEntity> existingPlayers = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        if (!existingPlayers.isEmpty()) {
            // If player already exists, ensure their DTO reflects current role if game started
            return existingPlayers.get(0); 
        }

        PlayerSessionEntity playerSession = new PlayerSessionEntity();
        playerSession.setSession(session);
        playerSession.setUser(user);
        playerSession.setActive(true);
        playerSession.setTotalScore(0);
        playerSession.setGrammarStreak(0);
        // Note: Role is typically assigned when the game starts or groups are organized,
        // not necessarily immediately on join, unless that's the desired logic.

        session.getPlayers().add(playerSession); // Ensure bidirectional relationship if managed this way
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
     * @param sessionId the ID of the session to end
     * @param generateComprehension whether to generate comprehension questions
     * @return Map containing session status and any generated comprehension data
     */
    @Transactional
    public Map<String, Object> endSessionWithComprehension(Long sessionId, boolean generateComprehension) {
        // End the session
        GameSessionEntity session = endSession(sessionId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", "completed");
        result.put("sessionId", sessionId);
        
        // If comprehension check requested, generate questions for all players
        if (generateComprehension) {
            Map<Long, List<Map<String, Object>>> playerQuestions = new HashMap<>();
            
            List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
            for (PlayerSessionEntity player : players) {
                try {
                    Long studentId = player.getUser().getId();
                    
                    // Check if player had any messages in the session
                    List<ChatMessageEntity> messages = chatmessageRepository
                        .findBySessionIdAndSenderIdOrderByTimestampAsc(sessionId, studentId);
                    
                    if (!messages.isEmpty()) {
                        List<Map<String, Object>> questions = 
                            comprehensionCheckService.generateComprehensionQuestions(sessionId, studentId);
                        
                        playerQuestions.put(studentId, questions);
                    }
                } catch (Exception e) {
                    logger.error("Error generating comprehension questions for player {} in session {}: {}",
                        player.getUser().getId(), sessionId, e.getMessage(), e);
                }
            }
            
            result.put("comprehensionQuestions", playerQuestions);
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