package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ContentData;
import cit.edu.wrdmstr.entity.PowerupCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PowerupCardRepository extends JpaRepository<PowerupCard, Long> {
    List<PowerupCard> findByContentData(ContentData contentData);
    List<PowerupCard> findByRarity(String rarity);
    List<PowerupCard> findByTriggerCondition(String triggerCondition);
}
