package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.entity.ScoreRecordEntity;
import cit.edu.wrdmstr.service.gameplay.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game-stats")
@CrossOrigin("*")
public class GameStatisticsController {

    @Autowired
    private ScoreService scoreService;

    @GetMapping("/sessions/{sessionId}/scores")
    public ResponseEntity<List<Map<String, Object>>> getSessionScores(@PathVariable Long sessionId) {
        List<Map<String, Object>> scores = scoreService.getSessionLeaderboard(sessionId);
        return ResponseEntity.ok(scores);
    }
    
    @GetMapping("/sessions/{sessionId}/players/{playerId}/breakdown")
    public ResponseEntity<List<Map<String, Object>>> getPlayerScoreBreakdown(
            @PathVariable Long sessionId,
            @PathVariable Long playerId) {
        
        List<Map<String, Object>> breakdown = scoreService.getPlayerScoreBreakdown(sessionId, playerId);
        return ResponseEntity.ok(breakdown);
    }
    
    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<List<ScoreRecordEntity>> getSessionScoreHistory(@PathVariable Long sessionId) {
        List<ScoreRecordEntity> history = scoreService.getSessionScoreHistory(sessionId);
        return ResponseEntity.ok(history);
    }
}