package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.PlayerCardDTO;
import cit.edu.wrdmstr.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    @Autowired
    private CardService cardService;

    @GetMapping("/player/{sessionId}/user/{userId}")
    public ResponseEntity<List<PlayerCardDTO>> getPlayerCards(
            @PathVariable Long sessionId,
            @PathVariable Long userId,
            Authentication auth) {
        try {
            List<PlayerCardDTO> cards = cardService.getPlayerCardsByUserId(sessionId, userId);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of()); // Return empty list on error
        }
    }

    @PostMapping("/use/{cardId}")
    public ResponseEntity<Map<String, Object>> useCard(
            @PathVariable Long cardId,
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            String message = request.get("message");
            Map<String, Object> result = cardService.useCardWithMessage(cardId, message);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error using card: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/generate/{contentId}")
    public ResponseEntity<Map<String, Object>> generateCardsForContent(
            @PathVariable Long contentId,
            Authentication auth) {
        try {
            cardService.generateCardsForContent(contentId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cards generated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error generating cards: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}