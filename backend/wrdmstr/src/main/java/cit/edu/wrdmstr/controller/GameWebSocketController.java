package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.PlayerSessionDTO;
import cit.edu.wrdmstr.dto.WordSubmissionDTO;
import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.service.gameplay.GameSessionManagerService;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory
@Controller
public class GameWebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(GameWebSocketController.class); // Initialize Logger

    @Autowired
    private GameSessionManagerService gameSessionManagerService;

    @Autowired
    private GameSessionService gameSessionService;

    @MessageMapping("/game/{sessionId}/word")
    @SendTo("/topic/game/{sessionId}/updates")
    public Map<String, Object> submitWord(@DestinationVariable Long sessionId, 
                                          WordSubmissionDTO submission,
                                          Principal principal) {
        String email = principal.getName();
        Long userId = gameSessionService.getUserIdByEmail(email);
        boolean success = gameSessionManagerService.submitWord(sessionId, userId, submission);
        
        return Map.of(
            "success", success,
            "message", success ? "Word submitted successfully" : "Failed to submit word",
            "word", submission.getWord()
        );
    }

    @MessageMapping("/game/{sessionId}/join")
    @SendTo("/topic/game/{sessionId}/players")
    @Transactional
    public List<PlayerSessionDTO> joinGame(@DestinationVariable Long sessionId, Principal principal) {
        String email = principal.getName();
        Long userId = gameSessionService.getUserIdByEmail(email);
        
        // Return proper DTOs
        return gameSessionService.getSessionPlayerDTOs(sessionId);
    }

//    @MessageMapping("/game/{sessionId}/submit")
//    public void handleSubmit(@DestinationVariable Long sessionId, String message) {
//        // TODO: Implement your game logic here
//        System.out.println("Received message for session " + sessionId + ": " + message);
//
//        // You can broadcast updates using SimpMessagingTemplate if needed
//    }

    @MessageMapping("/game/{sessionId}/submit")
    public void submitWordSentence(@DestinationVariable Long sessionId,
                                   WordSubmissionDTO submission, // Expecting WordSubmissionDTO
                                   Principal principal) {
        String email = principal.getName();
        Long userId = gameSessionService.getUserIdByEmail(email);

        logger.info("Received word submission for session {} from user {}: {}", sessionId, userId, submission.getWord());

        // Call the service method to handle the submission and advance the turn
        boolean success = gameSessionManagerService.submitWord(sessionId, userId, submission);

        if (!success) {
            logger.warn("Word submission failed for session {} by user {}.", sessionId, userId);
            // Optionally, send an error message back to the specific user if needed
            // e.g., messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", "Invalid submission");
        }
        // The GameSessionManagerService will handle broadcasting the next turn and timer updates
    }
}