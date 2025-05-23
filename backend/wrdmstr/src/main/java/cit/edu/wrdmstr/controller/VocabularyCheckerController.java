package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.service.gameplay.VocabularyCheckerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyCheckerController {
    
    @Autowired private VocabularyCheckerService vocabularyCheckerService;
    
    @GetMapping("/exercises/{sessionId}/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getVocabularyExercises(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        
        List<Map<String, Object>> exercises = 
            vocabularyCheckerService.generateVocabularyExercises(sessionId, studentId);
        
        return ResponseEntity.ok(exercises);
    }
    
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkVocabulary(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        
        String text = (String) request.get("text");
        Long sessionId = Long.parseLong(request.get("sessionId").toString());
        Long userId = Long.parseLong(request.get("userId").toString());
        
        VocabularyCheckerService.VocabularyCheckResult result = 
            vocabularyCheckerService.checkVocabulary(text, sessionId, userId);
        
        Map<String, Object> response = Map.of(
            "score", result.getScore(),
            "feedback", result.getFeedback(),
            "usedWords", result.getUsedWords()
        );
        
        return ResponseEntity.ok(response);
    }
}