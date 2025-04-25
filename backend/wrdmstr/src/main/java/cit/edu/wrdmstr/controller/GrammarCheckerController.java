package cit.edu.wrdmstr.controller;


import cit.edu.wrdmstr.service.gameplay.GrammarCheckerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/grammar")
public class GrammarCheckerController {

    @Autowired
    private GrammarCheckerService grammarCheckerService;

    @PostMapping("/check")
    public ResponseEntity<?> checkGrammar(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        if (text == null || text.isEmpty()) {
            return ResponseEntity.badRequest().body("Text is required");
        }

        GrammarCheckerService.GrammarCheckResult result = grammarCheckerService.checkGrammar(text);

        Map<String, Object> response = new HashMap<>();
        response.put("originalText", text);
        response.put("correctedText", result.getFeedback());
        response.put("status", result.getStatus().toString());
        response.put("feedback", result.getFeedback());
        response.put("errors", result.getStatus());

        return ResponseEntity.ok(response);
    }
}