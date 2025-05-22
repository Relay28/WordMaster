package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageEntityRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findBySessionIdOrderByTimestampAsc(Long sessionId);

    @Query("SELECT cm FROM ChatMessageEntity cm WHERE cm.session.id = :sessionId AND cm.containsWordBomb = true")
    List<ChatMessageEntity> findWordBombMessages(@Param("sessionId") Long sessionId);

    @Query("SELECT cm FROM ChatMessageEntity cm WHERE cm.session.id = :sessionId AND cm.grammarStatus = :status")
    List<ChatMessageEntity> findByGrammarStatus(@Param("sessionId") Long sessionId,
                                          @Param("status") ChatMessageEntity.MessageStatus status);

    @Query("SELECT cm FROM ChatMessageEntity cm WHERE cm.session.id = :sessionId AND cm.playerSession.role.id = :roleId")
    List<ChatMessageEntity> findByRoleId(@Param("sessionId") Long sessionId,
                                   @Param("roleId") Long roleId);
    // New method to find chat messages by playerSessionId
    List<ChatMessageEntity> findByPlayerSessionId(Long playerSessionId);

    // New method to count chat messages by playerSessionId
    int countByPlayerSessionId(Long playerSessionId);
}