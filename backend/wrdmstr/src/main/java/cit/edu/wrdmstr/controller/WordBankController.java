package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.WordBankItemDTO;
import cit.edu.wrdmstr.entity.ContentData;
import cit.edu.wrdmstr.entity.ContentEntity;
import cit.edu.wrdmstr.entity.WordBankItem;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.WordBankItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wordbank")
@CrossOrigin("*")
public class WordBankController {

    @Autowired
    private WordBankItemRepository wordBankRepository;
    
    @Autowired
    private ContentRepository contentRepository;

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
}