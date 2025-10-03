package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.GameStateDTO;
import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import cit.edu.wrdmstr.dto.GameSessionDTO;
import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.service.gameplay.GameSessionManagerService;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class GameSessionController {

    @Autowired
    private GameSessionService gameSessionService;
    
    @Autowired
    private GameSessionManagerService gameSessionManagerService;

    @PostMapping
    public ResponseEntity<?> createSession(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        Long contentId = request.get("contentId");
        if (contentId == null) {
            // Always return JSON error
            return ResponseEntity.badRequest().body(Map.of("error", "Missing contentId"));
        }
        try {
            GameSessionEntity session = gameSessionService.createSession(contentId, authentication);
            GameSessionDTO dto = gameSessionService.toDTO(session);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            // Always return JSON error
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/start")
    public ResponseEntity<Void> startSession(
            @PathVariable Long sessionId, 
            Authentication authentication) {
        gameSessionService.verifyTeacherAccess(sessionId, authentication);
        gameSessionManagerService.startGame(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/join")
    public ResponseEntity<PlayerSessionEntity> joinSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        String email = authentication.getName();
        Long userId = gameSessionService.getUserIdByEmail(email);
        PlayerSessionEntity player = gameSessionService.joinSession(sessionId, userId);
        return ResponseEntity.ok(player);
    }

    @GetMapping("/teacher/sessions/content/{contentId}/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessionsByContent(
            @PathVariable Long contentId,
            Authentication authentication) {

        String email = authentication.getName();
        Long teacherId = gameSessionService.getUserIdByEmail(email);

        // Verify teacher access to the content

        List<Map<String, Object>> activeSessions = gameSessionService.getActiveSessionsWithDetails(contentId);
        return ResponseEntity.ok(activeSessions);
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<Void> endSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        gameSessionService.verifyTeacherAccess(sessionId, authentication);
        gameSessionManagerService.endGame(sessionId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{sessionId}/state")
    public ResponseEntity<GameStateDTO> getGameState(@PathVariable Long sessionId, Authentication authentication) {
        System.out.println("GameState endpoint hit for session: " + sessionId + ", user: " + (authentication != null ? authentication.getName() : "null"));
        GameStateDTO state = gameSessionManagerService.getGameState(sessionId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .header(HttpHeaders.ETAG, "") // Remove ETag
            .body(state);
    }
    
    @GetMapping("/{sessionId}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@PathVariable Long sessionId) {
        List<Map<String, Object>> leaderboard = gameSessionManagerService.getSessionLeaderboard(sessionId);
        return ResponseEntity.ok(leaderboard);
    }
    
    @GetMapping("/{sessionId}/players")
    public ResponseEntity<List<PlayerSessionDTO>> getSessionPlayers(@PathVariable Long sessionId) {
        // Convert entities to DTOs
        List<PlayerSessionDTO> playerDTOs = gameSessionService.getSessionPlayerDTOs(sessionId);
        return ResponseEntity.ok(playerDTOs);
    }
    
    @GetMapping("/{sessionCode}/join-by-code")
    public ResponseEntity<GameSessionDTO> getSessionByCode(@PathVariable String sessionCode) {
        GameSessionEntity session = gameSessionService.getSessionByCode(sessionCode);
        GameSessionDTO dto = gameSessionService.toDTO(session);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/active")
    public ResponseEntity<List<GameSessionDTO>> getActiveGames() {
        List<GameSessionEntity> activeGames = gameSessionService.getActiveGames();
        List<GameSessionDTO> dtos = activeGames.stream().map(gameSessionService::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/teacher")
    public ResponseEntity<List<GameSessionDTO>> getTeacherGames(Authentication authentication) {
        String email = authentication.getName();
        Long teacherId = gameSessionService.getUserIdByEmail(email);
        List<GameSessionEntity> games = gameSessionService.getSessionsByTeacher(teacherId);
        List<GameSessionDTO> dtos = games.stream().map(gameSessionService::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/student")
    public ResponseEntity<List<GameSessionDTO>> getStudentGames(Authentication authentication) {
        String email = authentication.getName();
        Long studentId = gameSessionService.getUserIdByEmail(email);
        List<GameSessionEntity> games = gameSessionService.getSessionsByStudent(studentId);
        List<GameSessionDTO> dtos = games.stream().map(gameSessionService::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{sessionId}/assign-word-bombs")
    public ResponseEntity<List<Map<String, Object>>> assignWordBombs(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        gameSessionService.verifyTeacherAccess(sessionId, authentication);
        List<Map<String, Object>> result = gameSessionService.assignWordBombs(sessionId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        gameSessionService.verifyTeacherAccess(sessionId, authentication);
        gameSessionService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }
}