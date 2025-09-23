package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.model.AiCacheEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiCacheRepository extends JpaRepository<AiCacheEntry, Long> {
    Optional<AiCacheEntry> findByPromptHash(String promptHash);
}
