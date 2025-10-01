package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.AiStreamMessage;
import cit.edu.wrdmstr.service.AsyncAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import javax.annotation.PostConstruct;
import java.util.concurrent.Executor;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/ai")
public class AIStreamController {
    private static final Logger logger = LoggerFactory.getLogger(AIStreamController.class);

    private final AsyncAIService asyncAIService;
    private final SimpMessagingTemplate simp;
    private final Executor taskExecutor;

    public AIStreamController(AsyncAIService asyncAIService, 
                            SimpMessagingTemplate simp,
                            @Qualifier("aiTaskExecutor") Executor taskExecutor) {
        this.asyncAIService = asyncAIService;
        this.simp = simp;
        this.taskExecutor = taskExecutor;
    }
    
    @PostConstruct
    public void init() {
        // Pre-warm the executor
        taskExecutor.execute(() -> logger.debug("Pre-warming executor thread pool"));
    }

    // Simple POST endpoint to trigger async AI work and rely on WebSocket streaming
    @PostMapping("/submit")
    public String submitForAnalysis(@RequestBody Map<String, Object> body, @RequestParam(required = false) String sessionId) {
        // Start async task; it will broadcast via /topic/ai/{sessionId} if sessionId provided
        CompletableFuture<String> future = asyncAIService.callAIModelAsync(body, sessionId);
        // Return a simple ack; client should be listening on WebSocket or can poll
        return "accepted";
    }

    // SSE endpoint fallback for browsers that prefer EventSource
    @PostMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEndpoint(@RequestBody Map<String, Object> body) {
        SseEmitter emitter = new SseEmitter(0L);
        String sessionId = null; // not using session-based topic here; stream directly

        asyncAIService.callAIModelAsync(body, sessionId).thenAccept(result -> {
            try {
                emitter.send(new AiStreamMessage("final", result));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        }).exceptionally(ex -> {
            try {
                emitter.send(new AiStreamMessage("error", ex.getMessage()));
            } catch (IOException e) { /* ignore */ }
            emitter.completeWithError(ex);
            return null;
        });

        return emitter;
    }
}
