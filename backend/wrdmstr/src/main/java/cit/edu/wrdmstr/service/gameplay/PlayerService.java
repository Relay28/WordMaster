package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
@Transactional
public class PlayerService {
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private RoleRepository roleRepository;

    public PlayerSessionEntity assignNewWordBomb(Long playerId) {
        PlayerSessionEntity player = playerSessionRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found"));

        ContentData contentData = player.getSession().getContent().getContentData();
        List<WordBankItem> wordBank = wordBankItemRepository.findByContentData(contentData);

        if (wordBank.isEmpty()) {
            throw new IllegalStateException("No words available in word bank");
        }

        String newWord = wordBank.get(new Random().nextInt(wordBank.size())).getWord();
        player.setCurrentWordBomb(newWord);
        player.setWordBombUsed(false);

        return playerSessionRepository.save(player);
    }

    public PlayerSessionEntity updatePlayerRole(Long playerId, Long roleId) {
        PlayerSessionEntity player = playerSessionRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        // Remove from old role's player list if exists
        if (player.getRole() != null) {
            player.getRole().getPlayerSessions().remove(player);
        }

        // Set new role
        player.setRole(role);
        role.getPlayerSessions().add(player);

        return playerSessionRepository.save(player);
    }

    public List<PlayerSessionEntity> getSessionLeaderboard(Long sessionId) {
        return playerSessionRepository.findBySessionIdOrderByTotalScoreDesc(sessionId);
    }

    // ... other methods ...
}