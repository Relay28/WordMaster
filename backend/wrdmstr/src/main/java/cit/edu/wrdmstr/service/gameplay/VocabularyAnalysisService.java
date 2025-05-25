package cit.edu.wrdmstr.service.gameplay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class VocabularyAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(VocabularyAnalysisService.class);
    
    private Set<String> commonWords;
    private Set<String> academicWords;
    
    @Value("${vocabulary.analysis.common-words-file:/vocabulary/common-words.txt}")
    private String commonWordsFile;
    
    @Value("${vocabulary.analysis.academic-words-file:/vocabulary/academic-words.txt}")
    private String academicWordsFile;
    
    @Value("${vocabulary.analysis.min-word-length:3}")
    private int minWordLength;
    
    @Value("${vocabulary.analysis.advanced-word-length:7}")
    private int advancedWordLength;
    
    // Empty constructor for Spring
    public VocabularyAnalysisService() {
        // Don't initialize here - Spring hasn't injected @Value fields yet
    }
    
    // Initialize after Spring has injected all dependencies
    @PostConstruct
    public void init() {
        this.commonWords = loadWordsFromResource(commonWordsFile);
        this.academicWords = loadWordsFromResource(academicWordsFile);
        
        logger.info("Loaded {} common words and {} academic words", 
                   commonWords.size(), academicWords.size());
    }
    
    private Set<String> loadWordsFromResource(String resourcePath) {
        try (InputStream is = getClass().getResourceAsStream(resourcePath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            
            if (is == null) {
                logger.warn("Resource not found: {}, using fallback", resourcePath);
                return getDefaultWords(resourcePath);
            }
            
            Set<String> words = reader.lines()
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                .collect(Collectors.toSet());
                
            logger.debug("Loaded {} words from {}", words.size(), resourcePath);
            return words;
                
        } catch (Exception e) {
            logger.warn("Could not load word list from {}, using fallback: {}", resourcePath, e.getMessage());
            return getDefaultWords(resourcePath);
        }
    }
    
    private Set<String> getDefaultWords(String resourcePath) {
        if (resourcePath.contains("common")) {
            return Set.of("the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
                         "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
                         "this", "but", "his", "by", "from", "they", "we", "say", "her", "she");
        } else {
            return Set.of("analyze", "concept", "data", "define", "derive", "distribute", 
                         "establish", "estimate", "evaluate", "factor", "function", "identify",
                         "interpret", "method", "principle", "procedure", "process", "research",
                         "significant", "theory");
        }
    }
    
    /**
     * Analyzes the vocabulary complexity in a text
     */
    public Map<String, Object> analyzeVocabulary(String text) {
        Map<String, Object> analysis = new HashMap<>();
        
        // Tokenize and clean text
        List<String> words = tokenizeText(text);
        
        // Calculate metrics
        int totalWords = words.size();
        int uniqueWords = new HashSet<>(words).size();
        double typeTokenRatio = totalWords > 0 ? (double) uniqueWords / totalWords : 0;
        
        // Find advanced words
        List<String> advancedWords = identifyAdvancedWords(words);
        
        // Calculate lexical density
        double lexicalDensity = calculateLexicalDensity(words);
        
        // Store results
        analysis.put("totalWords", totalWords);
        analysis.put("uniqueWords", uniqueWords);
        analysis.put("typeTokenRatio", typeTokenRatio);
        analysis.put("advancedWordCount", advancedWords.size());
        analysis.put("advancedWords", advancedWords);
        analysis.put("lexicalDensity", lexicalDensity);
        analysis.put("vocabularyLevel", determineVocabularyLevel(advancedWords.size(), totalWords, typeTokenRatio, lexicalDensity));
        
        return analysis;
    }
    
    private List<String> tokenizeText(String text) {
        // Simple tokenization - split on non-word chars and convert to lowercase
        return Arrays.stream(text.toLowerCase().split("\\W+"))
            .filter(word -> !word.isEmpty())
            .collect(Collectors.toList());
    }
    
    private List<String> identifyAdvancedWords(List<String> words) {
        return words.stream()
            .filter(word -> word.length() > minWordLength)
            .filter(word -> !commonWords.contains(word.toLowerCase()))
            .filter(word -> academicWords.contains(word.toLowerCase()) || word.length() > advancedWordLength)
            .distinct()
            .collect(Collectors.toList());
    }
    
    private double calculateLexicalDensity(List<String> words) {
        // Lexical density: ratio of content words to total words
        long contentWords = words.stream()
            .filter(word -> !commonWords.contains(word.toLowerCase()))
            .count();
        
        return words.size() > 0 ? (double) contentWords / words.size() : 0;
    }
    
    private String determineVocabularyLevel(int advancedWordCount, int totalWords, double typeTokenRatio, double lexicalDensity) {
        if (totalWords < 5) return "Insufficient text";
        
        double advancedRatio = totalWords > 0 ? (double) advancedWordCount / totalWords : 0;
        
        if (advancedRatio > 0.2 && typeTokenRatio > 0.7 && lexicalDensity > 0.5) {
            return "Advanced";
        } else if (advancedRatio > 0.1 && typeTokenRatio > 0.5 && lexicalDensity > 0.4) {
            return "Intermediate-Advanced";
        } else if (advancedRatio > 0.05 && typeTokenRatio > 0.4) {
            return "Intermediate";
        } else {
            return "Basic";
        }
    }
    
    // Optional: Method to get word statistics for debugging
    public Map<String, Integer> getWordStatistics() {
        return Map.of(
            "commonWordsCount", commonWords != null ? commonWords.size() : 0,
            "academicWordsCount", academicWords != null ? academicWords.size() : 0
        );
    }
    
    // Optional: Method to check if a word is in our lists
    public Map<String, Boolean> checkWord(String word) {
        String lowerWord = word.toLowerCase();
        return Map.of(
            "isCommon", commonWords != null && commonWords.contains(lowerWord),
            "isAcademic", academicWords != null && academicWords.contains(lowerWord),
            "isAdvanced", (academicWords != null && academicWords.contains(lowerWord)) || word.length() > 7
        );
    }
}