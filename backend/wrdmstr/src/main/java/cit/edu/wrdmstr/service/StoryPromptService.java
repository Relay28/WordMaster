package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.repository.GameSessionEntityRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class StoryPromptService {
    private static final Logger logger = LoggerFactory.getLogger(StoryPromptService.class);
    
    @Autowired
    private GameSessionEntityRepository gameSessionRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Add a new story prompt to the session
     */
    public void addStoryPrompt(Long sessionId, int turnNumber, String prompt) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        List<Map<String, Object>> storyElements = getStoryPrompts(sessionId);
        
        Map<String, Object> newElement = new HashMap<>();
        newElement.put("turnNumber", turnNumber);
        newElement.put("prompt", prompt);
        newElement.put("timestamp", new Date().getTime());
        
        storyElements.add(newElement);
        
        try {
            session.setStoryPrompts(objectMapper.writeValueAsString(storyElements));
            gameSessionRepository.save(session);
            logger.info("Added story prompt for session {} at turn {}", sessionId, turnNumber);
        } catch (JsonProcessingException e) {
            logger.error("Error serializing story prompts for session {}: {}", sessionId, e.getMessage());
            throw new RuntimeException("Failed to save story prompt", e);
        }
    }

    /**
     * Get all story prompts for a session
     */
    public List<Map<String, Object>> getStoryPrompts(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        if (session.getStoryPrompts() == null || session.getStoryPrompts().trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<List<Map<String, Object>>>() {};
            return objectMapper.readValue(session.getStoryPrompts(), typeRef);
        } catch (JsonProcessingException e) {
            logger.error("Error deserializing story prompts for session {}: {}", sessionId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get story prompts as a formatted string for comprehension questions
     */
    public String getStoryPromptsAsText(Long sessionId) {
        List<Map<String, Object>> storyElements = getStoryPrompts(sessionId);
        
        if (storyElements.isEmpty()) {
            return "";
        }
        
        StringBuilder storyText = new StringBuilder();
        storyText.append("STORY PROGRESSION:\n\n");
        
        for (Map<String, Object> element : storyElements) {
            Integer turnNumber = (Integer) element.get("turnNumber");
            String prompt = (String) element.get("prompt");
            
            storyText.append("Turn ").append(turnNumber).append(": ");
            storyText.append(prompt).append("\n\n");
        }
        
        return storyText.toString();
    }

    /**
     * Get the latest story prompt
     */
    public String getLatestStoryPrompt(Long sessionId) {
        List<Map<String, Object>> storyElements = getStoryPrompts(sessionId);
        
        if (storyElements.isEmpty()) {
            return null;
        }
        
        // Get the last element (latest prompt)
        Map<String, Object> latestElement = storyElements.get(storyElements.size() - 1);
        return (String) latestElement.get("prompt");
    }

    /**
     * Clear all story prompts for a session (useful for cleanup)
     */
    public void clearStoryPrompts(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Game session not found"));
        
        session.setStoryPrompts(null);
        gameSessionRepository.save(session);
        logger.info("Cleared story prompts for session {}", sessionId);
    }
}