package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.entity.ScoreRecordEntity;
import cit.edu.wrdmstr.repository.ScoreRecordEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/game-stats")
@CrossOrigin("*")
public class GameStatisticsController {

    @Autowired
    private ScoreRecordEntityRepository scoreRepository;

    @GetMapping("/sessions/{sessionId}/scores")
    public ResponseEntity<List<Map<String, Object>>> getSessionScores(@PathVariable Long sessionId) {
        List<Object[]> totalScores = scoreRepository.getTotalScoresByUser(sessionId);
        
        List<Map<String, Object>> formattedScores = totalScores.stream()
            .map(score -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("playerId", score[0]);
                entry.put("score", score[1]);
                return entry;
            })
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(formattedScores);
    }
    
    @GetMapping("/sessions/{sessionId}/players/{playerId}/breakdown")
    public ResponseEntity<List<Map<String, Object>>> getPlayerScoreBreakdown(
            @PathVariable Long sessionId,
            @PathVariable Long playerId) {
            
        List<Object[]> breakdown = scoreRepository.getScoreBreakdown(sessionId, playerId);
        
        List<Map<String, Object>> formattedBreakdown = breakdown.stream()
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("reason", entry[0]);
                item.put("points", entry[1]);
                return item;
            })
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(formattedBreakdown);
    }
    
    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<List<ScoreRecordEntity>> getSessionScoreHistory(@PathVariable Long sessionId) {
        List<ScoreRecordEntity> history = scoreRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        return ResponseEntity.ok(history);
    }
}