package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.WordSubmissionDTO;
import cit.edu.wrdmstr.service.gameplay.GameSessionManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class GameWebSocketController {

    @Autowired
    private GameSessionManagerService gameSessionManagerService;

    @MessageMapping("/game/{sessionId}/word")
    @SendTo("/topic/game/{sessionId}/updates")
    public Map<String, Object> submitWord(@DestinationVariable Long sessionId, 
                                          WordSubmissionDTO submission,
                                          Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        boolean success = gameSessionManagerService.submitWord(sessionId, userId, submission);
        
        return Map.of(
            "success", success,
            "message", success ? "Word submitted successfully" : "Failed to submit word",
            "word", submission.getWord()
        );
    }

    @MessageMapping("/game/{sessionId}/join")
    @SendTo("/topic/game/{sessionId}/players")
    public void joinGame(@DestinationVariable Long sessionId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        gameSessionManagerService.joinGame(sessionId, userId);
    }

    @MessageMapping("/game/{sessionId}/submit")
    public void handleSubmit(@DestinationVariable Long sessionId, String message) {
        // TODO: Implement your game logic here
        System.out.println("Received message for session " + sessionId + ": " + message);
        // You can broadcast updates using SimpMessagingTemplate if needed
    }
}