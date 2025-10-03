package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
//import cit.edu.wrdmstr.service.CardService;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlayerService {
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private RoleRepository roleRepository;
   // @Autowired private CardService cardService;

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

    @Transactional
    public PlayerSessionEntity joinSessionAndDrawCards(Long sessionId, Long userId) {
        // Get existing session join logic from GameSessionService
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (session.getTeacher() != null && session.getTeacher().getId()==(userId)) {
            throw new IllegalStateException("Teacher cannot join the session as a player.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check for existing active player sessions first
        List<PlayerSessionEntity> existingPlayers = playerSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        
        // Filter for active players only
        List<PlayerSessionEntity> activePlayers = existingPlayers.stream()
                .filter(PlayerSessionEntity::isActive)
                .collect(Collectors.toList());
        
        PlayerSessionEntity player;
        if (!activePlayers.isEmpty()) {
            // Return the existing active player
            player = activePlayers.get(0);
        } else {
            // Create new player session
            PlayerSessionEntity playerSession = new PlayerSessionEntity();
            playerSession.setSession(session);
            playerSession.setUser(user);
            playerSession.setActive(true);
            playerSession.setTotalScore(0);
            playerSession.setGrammarStreak(0);

            player = playerSessionRepository.save(playerSession);
        }
        
        // Then draw cards for the player
//        try {
//            cardService.drawCardsForPlayer(player.getId());
//        } catch (Exception e) {
//            // Log the error but don't fail the join process
//            System.err.println("Failed to draw cards for player " + userId + ": " + e.getMessage());
//        }
        
        return player;
    }

    // ... other methods ...
}