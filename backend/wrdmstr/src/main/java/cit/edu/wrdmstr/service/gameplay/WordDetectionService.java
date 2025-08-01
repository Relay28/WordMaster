package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.WordBankItem;
import cit.edu.wrdmstr.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WordDetectionService {
    private static final Logger logger = LoggerFactory.getLogger(WordDetectionService.class);
    
    @Autowired
    private AIService aiService;
    
    /**
     * Detect word bank usage with AI-powered variation matching
     */
    public List<String> detectWordBankUsage(String text, List<WordBankItem> wordBankItems) {
        if (text == null || text.trim().isEmpty() || wordBankItems.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Extract word bank words
        List<String> wordBankWords = wordBankItems.stream()
            .map(WordBankItem::getWord)
            .collect(Collectors.toList());
        
        try {
            // Use AI to detect variations
            List<String> detectedWords = aiService.detectWordBankUsage(text, wordBankWords);
            
            logger.info("AI detected word bank usage in '{}': {}", text, detectedWords);
            return detectedWords;
            
        } catch (Exception e) {
            logger.warn("AI word detection failed, falling back to exact matching: {}", e.getMessage());
            return fallbackExactMatching(text, wordBankWords);
        }
    }
    
    /**
     * Fallback to exact matching if AI fails
     */
    private List<String> fallbackExactMatching(String text, List<String> wordBankWords) {
        List<String> foundWords = new ArrayList<>();
        String lowerText = text.toLowerCase();
        
        for (String word : wordBankWords) {
            String regex = "\\b" + word.toLowerCase() + "\\b";
            if (lowerText.matches(".*" + regex + ".*")) {
                foundWords.add(word);
            }
        }
        
        return foundWords;
    }
}