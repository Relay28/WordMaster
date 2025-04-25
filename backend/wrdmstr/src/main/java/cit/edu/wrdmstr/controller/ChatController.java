package cit.edu.wrdmstr.controller;


import cit.edu.wrdmstr.entity.ChatMessageEntity;
import cit.edu.wrdmstr.entity.MessageReactionEntity;
import cit.edu.wrdmstr.service.gameplay.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatMessageEntity> sendMessage(
            @PathVariable Long sessionId,
            @RequestParam Long userId,
            @RequestBody Map<String, String> payload) {

        String content = payload.get("content");
        if (content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ChatMessageEntity message = chatService.sendMessage(sessionId, userId, content);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageEntity>> getSessionMessages(@PathVariable Long sessionId) {
        List<ChatMessageEntity> messages = chatService.getSessionMessages(sessionId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<MessageReactionEntity> addReaction(
            @PathVariable Long messageId,
            @RequestParam Long userId,
            @RequestBody Map<String, String> payload) {

        String emoji = payload.get("emoji");
        if (emoji == null || emoji.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        MessageReactionEntity reaction = chatService.addReaction(messageId, userId, emoji);
        return ResponseEntity.ok(reaction);
    }
}