package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.WordBankItem;
import cit.edu.wrdmstr.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class WordDetectionService {
    private static final Logger logger = LoggerFactory.getLogger(WordDetectionService.class);
    
    @Autowired
    private AIService aiService;
    
    /**
     * Detect word bank usage with a fast local morphological pass first.
     * Only call AI if the text is sufficiently long or ambiguous AND we found at least one candidate stem.
     * This prevents pathological cases where a short nonsense message triggers a huge AI response
     * and accidental awarding of points.
     */
    public List<String> detectWordBankUsage(String text, List<WordBankItem> wordBankItems) {
        if (text == null || text.trim().isEmpty() || wordBankItems == null || wordBankItems.isEmpty()) {
            return Collections.emptyList();
        }

        final String original = text;
        String lower = original.toLowerCase();
        List<String> wordBankWords = wordBankItems.stream()
                .map(WordBankItem::getWord)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 1. Fast exact + simple morphological (plural / basic verb) detection
        Set<String> foundLocal = new HashSet<>();
        for (String wb : wordBankWords) {
            String base = wb.toLowerCase();
            if (base.isEmpty()) continue;
            // Build simple patterns: base, base+s, base+es, base+ed, base+ing (common forms)
            String pattern = "\\b" + Pattern.quote(base) + "(s|es|ed|ing)?\\b";
            if (lower.matches(".*" + pattern + ".*")) {
                foundLocal.add(wb); // record original base word
            }
        }

        // 2. Guard: if text is very short OR lacks any alphabetic token >3 chars, skip AI
        boolean hasMeaningfulToken = Arrays.stream(lower.split("\\W+"))
                .anyMatch(tok -> tok.length() >= 4);
        if (original.length() < 20 || !hasMeaningfulToken) {
            logger.debug("WordDetectionService: Skipping AI detection (short / low-signal text)");
            // Still return local matches if we found any
            return new ArrayList<>(foundLocal);
        }

        // 3. Call AI to detect irregular forms and complex variations
        // AI will find: irregular verbs (saw→see, ate→eat, bought→buy), plurals, etc.
        try {
            List<String> aiDetected = aiService.detectWordBankUsage(original, wordBankWords);
            
            // Combine local and AI results
            Set<String> combined = new HashSet<>(foundLocal);
            if (aiDetected != null && !aiDetected.isEmpty()) {
                combined.addAll(aiDetected);
            }
            
            if (!combined.isEmpty()) {
                logger.info("WordDetectionService: Detected word bank usage in '{}' - Local: {}, AI: {}, Total: {}", 
                           original, foundLocal, aiDetected, combined);
                return new ArrayList<>(combined);
            }
            
            return Collections.emptyList();
        } catch (Exception e) {
            logger.warn("AI word detection failed ({}). Using local + fallback.", e.getMessage());
            // If AI fails, at least return local matches + fallback
            Set<String> fallbackResults = new HashSet<>(foundLocal);
            fallbackResults.addAll(fallbackExactMatching(original, wordBankWords));
            return new ArrayList<>(fallbackResults);
        }
    }
    
    /**
     * Extract the actual word variations found in the text that match the detected base words.
     * For example, if base words are [see, eat, photo], this extracts [saw, ate, photos] from the text.
     * This is needed for frontend highlighting.
     * 
     * @param text Original message text
     * @param detectedBaseWords Base word bank words that were detected (e.g., ["see", "eat", "photo"])
     * @return List of actual text variations found (e.g., ["saw", "ate", "photos"])
     */
    public List<String> extractTextVariations(String text, List<String> detectedBaseWords) {
        if (text == null || text.trim().isEmpty() || detectedBaseWords == null || detectedBaseWords.isEmpty()) {
            return Collections.emptyList();
        }
        
        Set<String> variations = new HashSet<>();
        String[] tokens = text.split("\\W+"); // Split on non-word characters
        
        // For each detected base word, find ALL its variations in the text
        for (String baseWord : detectedBaseWords) {
            String baseLower = baseWord.toLowerCase();
            
            // 1. Check for exact matches and simple morphological forms
            for (String token : tokens) {
                String tokenLower = token.toLowerCase();
                
                // Exact match
                if (tokenLower.equals(baseLower)) {
                    variations.add(token);
                    continue;
                }
                
                // Simple morphological forms: base+s, base+es, base+ed, base+ing
                if (tokenLower.matches(Pattern.quote(baseLower) + "(s|es|ed|ing)")) {
                    variations.add(token);
                    continue;
                }
                
                // Handle common verb forms ending in 'e': like+d=liked, make+s=makes
                if (baseLower.endsWith("e")) {
                    String stem = baseLower.substring(0, baseLower.length() - 1);
                    if (tokenLower.matches(Pattern.quote(stem) + "(ed|ing|es)")) {
                        variations.add(token);
                    }
                }
            }
            
            // 2. For irregular forms (saw→see, ate→eat), we need to check if this base word
            // was detected by AI, meaning some variation exists. We'll try common irregular patterns.
            // Common irregular verb forms
            Map<String, List<String>> irregularForms = Map.of(
                "see", Arrays.asList("saw", "seen", "seeing"),
                "eat", Arrays.asList("ate", "eaten", "eating"),
                "buy", Arrays.asList("bought", "buying"),
                "go", Arrays.asList("went", "gone", "going"),
                "come", Arrays.asList("came", "coming"),
                "take", Arrays.asList("took", "taken", "taking"),
                "make", Arrays.asList("made", "making"),
                "do", Arrays.asList("did", "done", "doing")
            );
            
            if (irregularForms.containsKey(baseLower)) {
                for (String irregularForm : irregularForms.get(baseLower)) {
                    for (String token : tokens) {
                        if (token.toLowerCase().equals(irregularForm)) {
                            variations.add(token);
                        }
                    }
                }
            }
        }
        
        logger.debug("WordDetectionService: Extracted text variations: {}", variations);
        return new ArrayList<>(variations);
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