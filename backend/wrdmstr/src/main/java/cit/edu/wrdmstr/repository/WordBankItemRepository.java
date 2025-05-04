package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ContentData;
import cit.edu.wrdmstr.entity.WordBankItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WordBankItemRepository extends JpaRepository<WordBankItem,Long> {

    List<WordBankItem> findByContentData(ContentData contentData);
    List<WordBankItem> findByContentDataContentId(Long contentId);
}
