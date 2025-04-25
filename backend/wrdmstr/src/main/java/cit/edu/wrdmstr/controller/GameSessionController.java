package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class GameSessionController {

    @Autowired
    private GameSessionService gameSessionService;

    @PostMapping
    public ResponseEntity<GameSessionEntity> createSession(
            @RequestBody Map<String, Long> request) {

        Long contentId = request.get("contentId");
        Long teacherId = request.get("teacherId");

        if (contentId == null || teacherId == null) {
            return ResponseEntity.badRequest().build();
        }

        GameSessionEntity session = gameSessionService.createSession(contentId, teacherId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/start")
    public ResponseEntity<GameSessionEntity> startSession(@PathVariable Long sessionId) {
        GameSessionEntity session = gameSessionService.startSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/join")
    public ResponseEntity<PlayerSessionEntity> joinSession(
            @PathVariable Long sessionId,
            @RequestParam Long userId) {

        PlayerSessionEntity player = gameSessionService.joinSession(sessionId, userId);
        return ResponseEntity.ok(player);
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<GameSessionEntity> endSession(@PathVariable Long sessionId) {
        GameSessionEntity session = gameSessionService.endSession(sessionId);
        return ResponseEntity.ok(session);
    }
}