package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.WordBankItemDTO;
import cit.edu.wrdmstr.entity.ContentData;
import cit.edu.wrdmstr.entity.ContentEntity;
import cit.edu.wrdmstr.entity.WordBankItem;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.WordBankItemRepository;
import cit.edu.wrdmstr.service.AIService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wordbank")
@CrossOrigin("https://wordmaster-nu.vercel.app")
public class WordBankController {

    @Autowired
    private WordBankItemRepository wordBankRepository;
    
    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private AIService aiService;

    @GetMapping("/content/{contentId}")
    public ResponseEntity<List<WordBankItemDTO>> getWordBankForContent(@PathVariable Long contentId) {
        List<WordBankItem> items = wordBankRepository.findByContentDataContentId(contentId);
        List<WordBankItemDTO> dtos = items.stream()
                .map(item -> new WordBankItemDTO(item.getId(), item.getWord()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping("/content/{contentId}")
    public ResponseEntity<WordBankItemDTO> addWordToBank(
            @PathVariable Long contentId,
            @RequestBody WordBankItemDTO wordDTO) {
        
        ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));
        
        ContentData contentData = content.getContentData();
        if (contentData == null) {
            throw new RuntimeException("Content data not found for this content");
        }
        
        WordBankItem wordBankItem = new WordBankItem();
        wordBankItem.setWord(wordDTO.getWord());
        wordBankItem.setContentData(contentData);
        
        WordBankItem savedItem = wordBankRepository.save(wordBankItem);
        
        return ResponseEntity.ok(new WordBankItemDTO(savedItem.getId(), savedItem.getWord()));
    }
    
    @DeleteMapping("/{wordId}")
    public ResponseEntity<Void> removeWordFromBank(@PathVariable Long wordId) {
        wordBankRepository.deleteById(wordId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/enrich")
    public ResponseEntity<WordBankItemDTO> enrichWordInfo(@RequestBody Map<String, String> request) {
        String word = request.get("word");
        if (word == null || word.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Call AI service to get description and example
        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("task", "word_enrichment");
        aiRequest.put("word", word);
        
        try {
            AIService.AIResponse response = aiService.callAIModel(aiRequest);
            String[] parts = response.getResult().split("\\|");
            
            WordBankItemDTO enrichedWord = new WordBankItemDTO();
            enrichedWord.setWord(word);
            
            // Clean up description - remove "Description: " prefix if present
            String description = parts.length > 0 ? parts[0].trim() : "No description available";
            if (description.toLowerCase().startsWith("description:")) {
                description = description.substring(description.indexOf(':') + 1).trim();
            }
            enrichedWord.setDescription(description);
            
            // Clean up example usage if needed
            String example = parts.length > 1 ? parts[1].trim() : "No example available";
            if (example.toLowerCase().startsWith("example:")) {
                example = example.substring(example.indexOf(':') + 1).trim();
            }
            enrichedWord.setExampleUsage(example);
            
            return ResponseEntity.ok(enrichedWord);
        } catch (Exception e) {
            return ResponseEntity.ok(new WordBankItemDTO(null, word, "No description available", "No example available"));
        }
    }
}