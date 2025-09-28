package cit.edu.wrdmstr.service.gameplay;

import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import java.util.*;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance text processing utilities to reduce latency
 * Provides cached, optimized text analysis for common operations
 */
@Service
public class OptimizedTextProcessor {
    
    // Pre-compiled patterns for better performance
    private static final Pattern TAGALOG_PATTERN = Pattern.compile(
        "\\b(?i)(ako|ikaw|siya|kami|kayo|sila|ang|ng|sa|na|ay|si|ni|kay|" +
        "hindi|oo|po|naman|kasi|tapos|yung|yun|dun|dito|doon|kung|" +
        "pero|para|about|lang|din|rin|mga|ba|eh|oh)\\b"
    );
    
    private static final Pattern PUNCTUATION_PATTERN = Pattern.compile("[.!?]$");
    private static final Pattern MULTIPLE_SPACES = Pattern.compile("\\s+");
    private static final Pattern CAPS_CHECK = Pattern.compile("[A-Z]");
    
    // Cache for processed text results
    private final Map<String, TextAnalysis> analysisCache = new ConcurrentHashMap<>();
    private final long CACHE_TTL_MS = 300000; // 5 minutes
    
    // Common ESL error patterns for quick detection
    private final Map<Pattern, String> commonErrorPatterns = new HashMap<>();
    
    public OptimizedTextProcessor() {
        initializeErrorPatterns();
    }
    
    private void initializeErrorPatterns() {
        // Common ESL patterns
        commonErrorPatterns.put(
            Pattern.compile("\\b(I|you|we|they)\\s+is\\b", Pattern.CASE_INSENSITIVE), 
            "Subject-verb agreement"
        );
        commonErrorPatterns.put(
            Pattern.compile("\\b(he|she|it)\\s+are\\b", Pattern.CASE_INSENSITIVE), 
            "Subject-verb agreement"
        );
        commonErrorPatterns.put(
            Pattern.compile("\\ba\\s+[aeiouAEIOU]"), 
            "Article usage (use 'an')"
        );
        commonErrorPatterns.put(
            Pattern.compile("\\ban\\s+[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]"), 
            "Article usage (use 'a')"
        );
    }
    
    /**
     * Fast analysis of text for common issues
     */
    @Cacheable(value = "textAnalysis", condition = "#text != null && #text.length() > 0")
    public TextAnalysis analyzeText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new TextAnalysis(text, true, Collections.emptyList(), 0);
        }
        
        String normalizedKey = normalizeForCaching(text);
        TextAnalysis cached = analysisCache.get(normalizedKey);
        if (cached != null && !isExpired(cached)) {
            return cached;
        }
        
        long startTime = System.nanoTime();
        
        // Quick checks
        boolean isEnglish = !containsTagalog(text);
        List<String> issues = new ArrayList<>();
        
        // Check for common issues
        if (!PUNCTUATION_PATTERN.matcher(text).find() && text.length() > 10) {
            issues.add("Missing punctuation at end");
        }
        
        if (!CAPS_CHECK.matcher(text).find() && text.length() > 20) {
            issues.add("Consider using capital letters");
        }
        
        // Check common ESL errors
        for (Map.Entry<Pattern, String> entry : commonErrorPatterns.entrySet()) {
            if (entry.getKey().matcher(text).find()) {
                issues.add(entry.getValue());
            }
        }
        
        long processingTime = (System.nanoTime() - startTime) / 1_000_000; // Convert to ms
        
        TextAnalysis result = new TextAnalysis(text, isEnglish, issues, processingTime);
        
        // Cache result
        analysisCache.put(normalizedKey, result);
        cleanupCacheIfNeeded();
        
        return result;
    }
    
    /**
     * Quick check if text contains Tagalog words
     */
    public boolean containsTagalog(String text) {
        return TAGALOG_PATTERN.matcher(text.toLowerCase()).find();
    }
    
    /**
     * Fast text normalization
     */
    public String normalizeText(String text) {
        if (text == null) return "";
        return MULTIPLE_SPACES.matcher(text.trim()).replaceAll(" ");
    }
    
    /**
     * Generate quick encouraging feedback based on analysis
     */
    public String generateQuickFeedback(TextAnalysis analysis) {
        if (!analysis.isEnglish()) {
            return "💡 Please try writing in English! You're doing great!";
        }
        
        if (analysis.getIssues().isEmpty()) {
            return getRandomPositiveFeedback();
        } else if (analysis.getIssues().size() <= 2) {
            return "✓ Good work! Just " + analysis.getIssues().size() + 
                   " small improvement" + (analysis.getIssues().size() > 1 ? "s" : "") + " found.";
        } else {
            return "💡 Keep practicing! Several areas for improvement found.";
        }
    }
    
    private String getRandomPositiveFeedback() {
        String[] feedbacks = {
            "✓ Excellent! Your grammar looks great.",
            "✓ Perfect! Well written message.",
            "✓ Great job! Clear and understandable.",
            "✓ Outstanding! No issues found.",
            "✓ Wonderful! Your English is improving."
        };
        return feedbacks[new Random().nextInt(feedbacks.length)];
    }
    
    private String normalizeForCaching(String text) {
        return text.trim().toLowerCase().replaceAll("\\s+", " ");
    }
    
    private boolean isExpired(TextAnalysis analysis) {
        return System.currentTimeMillis() - analysis.getTimestamp() > CACHE_TTL_MS;
    }
    
    private void cleanupCacheIfNeeded() {
        if (analysisCache.size() > 1000) {
            long now = System.currentTimeMillis();
            analysisCache.entrySet().removeIf(entry -> 
                now - entry.getValue().getTimestamp() > CACHE_TTL_MS);
        }
    }
    
    /**
     * Result class for text analysis
     */
    public static class TextAnalysis {
        private final String originalText;
        private final boolean isEnglish;
        private final List<String> issues;
        private final long processingTimeMs;
        private final long timestamp;
        
        public TextAnalysis(String originalText, boolean isEnglish, List<String> issues, long processingTimeMs) {
            this.originalText = originalText;
            this.isEnglish = isEnglish;
            this.issues = new ArrayList<>(issues);
            this.processingTimeMs = processingTimeMs;
            this.timestamp = System.currentTimeMillis();
        }
        
        // Getters
        public String getOriginalText() { return originalText; }
        public boolean isEnglish() { return isEnglish; }
        public List<String> getIssues() { return new ArrayList<>(issues); }
        public long getProcessingTimeMs() { return processingTimeMs; }
        public long getTimestamp() { return timestamp; }
        public boolean hasIssues() { return !issues.isEmpty(); }
    }
}
