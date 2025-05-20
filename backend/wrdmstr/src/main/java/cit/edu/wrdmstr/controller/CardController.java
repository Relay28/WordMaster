package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.CardUseRequest;
import cit.edu.wrdmstr.dto.PlayerCardDTO;
import cit.edu.wrdmstr.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    @Autowired
    private CardService cardService;

    @GetMapping("/player/{playerSessionId}")
    public List<PlayerCardDTO> getPlayerCards(@PathVariable Long playerSessionId) {
        return cardService.getPlayerCards(playerSessionId);
    }

    @PostMapping("/use")
    public ResponseEntity<?> useCard(@RequestBody CardUseRequest request) {
        boolean success = cardService.useCard(request.getCardId(), request.getMessage());
        if (success) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().body("Card condition not met or already used");
        }
    }
}