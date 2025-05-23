package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.GameSessionDTO;
import cit.edu.wrdmstr.dto.GameStateDTO;
import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.service.gameplay.GameSessionManagerService;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private static final Logger logger = LoggerFactory.getLogger(GameController.class);

    private final GameSessionService gameSessionService;
    private final GameSessionManagerService gameSessionManager;

    @Autowired
    public GameController(
            GameSessionService gameSessionService,
            GameSessionManagerService gameSessionManager) {
        this.gameSessionService = gameSessionService;
        this.gameSessionManager = gameSessionManager;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGame(
            @RequestBody Map<String, Long> request,
            Authentication auth) {
        
        Long contentId = request.get("contentId");
        Long classroomId = request.get("classroomId");
        
        if (contentId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content ID is required"));
        }
        
        try {
            GameSessionEntity session = gameSessionService.createSession(contentId, auth);
            
            // Convert to DTO
            GameSessionDTO dto = convertToDTO(session);
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Error creating game session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{sessionId}/start")
    public ResponseEntity<?> startGame(
            @PathVariable Long sessionId,
            Authentication auth) {
        
        try {
            // Verify the user is the teacher/creator of this game session
            gameSessionService.verifyTeacherAccess(sessionId, auth);
            
            // Start the game
            gameSessionManager.startGame(sessionId);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Game started successfully"
            ));
        } catch (Exception e) {
            logger.error("Error starting game: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getGameStatus(
            @PathVariable Long sessionId,
            Authentication auth) {
        
        try {
            GameStateDTO gameState = gameSessionManager.getGameState(sessionId);
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            logger.error("Error getting game state: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<?> getGamesByClassroom(
            @PathVariable Long classroomId,
            Authentication auth) {
        
        try {
            List<GameSessionEntity> sessions = gameSessionService.getSessionsByClassroom(classroomId);
            
            List<GameSessionDTO> dtoList = sessions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(dtoList);
        } catch (Exception e) {
            logger.error("Error getting games for classroom: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{sessionId}/players")
    public ResponseEntity<?> getGamePlayers(
            @PathVariable Long sessionId,
            Authentication auth) {
        
        try {
            List<PlayerSessionEntity> players = gameSessionService.getSessionPlayers(sessionId);

            List<Map<String, Object>> playerList = players.stream()
                .map(p -> {
                    Map<String, Object> playerMap = new HashMap<>();
                    playerMap.put("id", p.getUser().getId());
                    playerMap.put("name", p.getUser().getFname() + " " + p.getUser().getLname());
                    playerMap.put("role", p.getRole() != null ? p.getRole().getName() : null);
                    playerMap.put("score", p.getTotalScore());
                    return playerMap;
                })
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(playerList);
        } catch (Exception e) {
            logger.error("Error getting game players: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{sessionId}/leaderboard")
    public ResponseEntity<?> getGameLeaderboard(
            @PathVariable Long sessionId,
            Authentication auth) {
        
        try {
            List<Map<String, Object>> leaderboard = gameSessionManager.getSessionLeaderboard(sessionId);
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            logger.error("Error getting game leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sessions/{sessionId}/end-with-comprehension")
    public ResponseEntity<?> endSessionWithComprehension(
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "true") boolean generateComprehension,
            Authentication auth) {
        
        try {
            // Verify teacher access
            gameSessionService.verifyTeacherAccess(sessionId, auth);
            
            // End session with comprehension check
            Map<String, Object> result = gameSessionService.endSessionWithComprehension(
                sessionId, generateComprehension);
            
            return ResponseEntity.ok(result);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Only the teacher who created this game can end it"));
        } catch (Exception e) {
            logger.error("Error ending session with comprehension check: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to end session: " + e.getMessage()));
        }
    }
    
    @PostMapping("/join-by-code")
    public ResponseEntity<?> joinGameByCode(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        
        String code = request.get("code");
        
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Game code is required"));
        }
        
        try {
            GameSessionEntity session = gameSessionService.getSessionByCode(code);
            
            // Get user ID from authentication
            Long userId = (Long) auth.getPrincipal();
            
            // Join the session
            PlayerSessionEntity player = gameSessionService.joinSession(session.getId(), userId);
            
            // Return session information
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "sessionId", session.getId(),
                "message", "Successfully joined game session"
            ));
        } catch (Exception e) {
            logger.error("Error joining game by code: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private GameSessionDTO convertToDTO(GameSessionEntity session) {
        GameSessionDTO dto = new GameSessionDTO();
        dto.setId(session.getId());
        dto.setStatus(session.getStatus().toString());
        dto.setSessionCode(session.getSessionCode());
        
        if (session.getContent() != null) {
            dto.setContentId(session.getContent().getId());
            dto.setContentTitle(session.getContent().getTitle());
        }
        
        if (session.getTeacher() != null) {
            dto.setTeacherId(session.getTeacher().getId());
            dto.setTeacherName(session.getTeacher().getFname() + " " + session.getTeacher().getLname());
        }
        
        dto.setStartedAt(session.getStartedAt());
        dto.setEndedAt(session.getEndedAt());
        dto.setPlayerCount(session.getPlayers().size());
        
        return dto;
    }
}