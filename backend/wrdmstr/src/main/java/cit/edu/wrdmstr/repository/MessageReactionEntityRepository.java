package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.MessageReactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageReactionEntityRepository extends JpaRepository<MessageReactionEntity, Long> {
    List<MessageReactionEntity> findByMessageId(Long messageId);
    List<MessageReactionEntity> findByUserId(Long userId);
    boolean existsByMessageIdAndUserId(Long messageId, Long userId);

    @Query("SELECT mr.emoji, COUNT(mr) FROM MessageReactionEntity mr WHERE mr.message.id = :messageId GROUP BY mr.emoji")
    List<Object[]> countReactionsByEmoji(@Param("messageId") Long messageId);

    Optional<Object> findByMessageIdAndUserId(Long messageId, Long userId);
}