package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.GrammarResultDTO;
import cit.edu.wrdmstr.dto.VocabularyResultDTO;
import cit.edu.wrdmstr.entity.GrammarResultEntity;
import cit.edu.wrdmstr.entity.VocabularyResultEntity;
import org.springframework.stereotype.Service;

@Service
public class ResultConversionService {

    public GrammarResultDTO convertToDTO(GrammarResultEntity entity) {
        if (entity == null) {
            return null;
        }
        
        GrammarResultDTO dto = new GrammarResultDTO();
        dto.setId(entity.getId());
        dto.setGameSessionId(entity.getGameSession().getId());
        dto.setStudentId(entity.getStudent().getId());
        dto.setStudentName(entity.getStudent().getFname() + " " + entity.getStudent().getLname());
        dto.setPerfectCount(entity.getPerfectCount());
        dto.setMinorErrorsCount(entity.getMinorErrorsCount());
        dto.setMajorErrorsCount(entity.getMajorErrorsCount());
        dto.setGrammarStreak(entity.getGrammarStreak());
        dto.setGrammarAccuracy(entity.getGrammarAccuracy());
        dto.setCreatedAt(entity.getCreatedAt());
        
        return dto;
    }

    public VocabularyResultDTO convertToDTO(VocabularyResultEntity entity) {
        if (entity == null) {
            return null;
        }
        
        VocabularyResultDTO dto = new VocabularyResultDTO();
        dto.setId(entity.getId());
        dto.setGameSessionId(entity.getGameSession().getId());
        dto.setStudentId(entity.getStudent().getId());
        dto.setStudentName(entity.getStudent().getFname() + " " + entity.getStudent().getLname());
        dto.setVocabularyScore(entity.getVocabularyScore());
        dto.setUsedWords(entity.getUsedWordsList());
        dto.setUsedAdvancedWords(entity.getUsedAdvancedWordsList());
        dto.setCreatedAt(entity.getCreatedAt());
        
        return dto;
    }
}