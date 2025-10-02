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

        // 2. If we have direct matches, return them immediately (no AI needed)
        if (!foundLocal.isEmpty()) {
            logger.debug("WordDetectionService: Local detection hit {} -> {}", original, foundLocal);
            return new ArrayList<>(foundLocal);
        }

        // 3. Guard: if text is very short OR lacks any alphabetic token >3 chars, skip AI
        boolean hasMeaningfulToken = Arrays.stream(lower.split("\\W+"))
                .anyMatch(tok -> tok.length() >= 4);
        if (original.length() < 20 || !hasMeaningfulToken) {
            logger.debug("WordDetectionService: Skipping AI detection (short / low-signal text): '{}'");
            return Collections.emptyList();
        }

        // 4. (Optional heuristic) If none of the word bank stems appear as substrings at all, skip AI
        boolean anyStemPresent = wordBankWords.stream().anyMatch(w -> lower.contains(w.toLowerCase().substring(0, Math.min(4, w.length()))));
        if (!anyStemPresent) {
            logger.debug("WordDetectionService: Skipping AI detection (no stems found) for '{}'");
            return Collections.emptyList();
        }

        // 5. Call AI only now
        try {
            List<String> aiDetected = aiService.detectWordBankUsage(original, wordBankWords);
            // Defensive filtering: keep only words present as whole word or simple morphological variant
            if (aiDetected != null && !aiDetected.isEmpty()) {
                List<String> filtered = aiDetected.stream()
                        .filter(w -> {
                            String base = w.toLowerCase();
                            String pat = "\\b" + Pattern.quote(base) + "(s|es|ed|ing)?\\b";
                            return lower.matches(".*" + pat + ".*");
                        })
                        .collect(Collectors.toList());
                if (!filtered.isEmpty()) {
                    logger.info("AI detected validated word bank usage in '{}': {}", original, filtered);
                    return filtered;
                }
            }
            return Collections.emptyList();
        } catch (Exception e) {
            logger.warn("AI word detection failed ({}). Using fallback exact only.", e.getMessage());
            return fallbackExactMatching(original, wordBankWords);
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