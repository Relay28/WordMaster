package cit.edu.wrdmstr.service.interfaces;

import cit.edu.wrdmstr.dto.GrammarResultDTO;
import cit.edu.wrdmstr.dto.VocabularyResultDTO;
import cit.edu.wrdmstr.entity.GrammarResultEntity;
import cit.edu.wrdmstr.entity.VocabularyResultEntity;

public interface IResultConversionService {
    GrammarResultDTO convertToDTO(GrammarResultEntity entity);
    VocabularyResultDTO convertToDTO(VocabularyResultEntity entity);
}