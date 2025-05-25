package cit.edu.wrdmstr.service.interfaces;
import cit.edu.wrdmstr.dto.ContentDTO;
import cit.edu.wrdmstr.entity.ContentEntity;
import org.springframework.security.core.Authentication;

public interface IContentService {
    ContentDTO convertToDTO(ContentEntity content);
    ContentDTO generateAIContent(String topic, Authentication auth);
}