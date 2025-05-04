package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import cit.edu.wrdmstr.dto.GameSessionDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;

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
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private ContentRepository contentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private ClassroomRepository classroomRepository;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private RoleRepository roleRepository;

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

    public Long getUserIdByEmail(String email) {
        UserEntity user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return user.getId();
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

    // Add this method to get player DTOs for a session
    @Transactional(readOnly = true)
    public List<PlayerSessionDTO> getSessionPlayerDTOs(Long sessionId) {
        List<PlayerSessionEntity> players = playerSessionRepository.findBySessionId(sessionId);
        return players.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
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
    public synchronized PlayerSessionEntity joinSession(Long sessionId, Long userId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (session.getTeacher() != null && session.getTeacher().getId() == userId) {
            throw new IllegalStateException("Teacher cannot join the session as a player.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Prevent duplicate player sessions for the same user and session
        List<PlayerSessionEntity> existingPlayers = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        if (!existingPlayers.isEmpty()) {
            return existingPlayers.get(0); // Return the existing player session
        }

        PlayerSessionEntity playerSession = new PlayerSessionEntity();
        playerSession.setSession(session);
        playerSession.setUser(user);
        playerSession.setActive(true);
        playerSession.setTotalScore(0);
        playerSession.setGrammarStreak(0);

        session.getPlayers().add(playerSession);
        return playerSessionRepository.save(playerSession);
    }

    public GameSessionEntity endSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Game session not found"));
        
        session.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
        session.setEndedAt(new Date());
        return gameSessionRepository.save(session);
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
        
        // Get word bank for this content
        ContentEntity content = session.getContent();
        List<WordBankItem> wordBank = wordBankItemRepository.findByContentData(content.getContentData());
        
        if (wordBank.isEmpty()) {
            throw new IllegalStateException("No words available in word bank");
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        Random random = new Random();
        
        for (PlayerSessionEntity player : players) {
            String newWord = wordBank.get(random.nextInt(wordBank.size())).getWord();
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