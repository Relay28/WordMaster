package cit.edu.wrdmstr.service.gameplay;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Transactional
public class GameSessionService {
    @Autowired private GameSessionEntityRepository gameSessionRepository;
    @Autowired private ContentRepository contentEntityRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PlayerSessionEntityRepository playerSessionRepository;
    @Autowired private WordBankItemRepository wordBankItemRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private ScoreRecordEntityRepository scoreRecordRepository;

    public GameSessionEntity createSession(Long contentId, Long teacherId) {
        ContentEntity content = contentEntityRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));

        UserEntity teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));

        GameSessionEntity session = new GameSessionEntity();
        session.setContent(content);
        session.setTeacher(teacher);
       // session.setSessionCode(generateSessionCode());
        session.setStatus(GameSessionEntity.SessionStatus.PENDING);

        // Add to content's session list
        content.getGameSessions().add(session);

        return gameSessionRepository.save(session);
    }

    public GameSessionEntity startSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        assignRolesAndWordBombs(session);
        session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
        session.setStartedAt(new Date());

        return gameSessionRepository.save(session);
    }

    private void assignRolesAndWordBombs(GameSessionEntity session) {
        ContentData contentData = session.getContent().getContentData();
        List<Role> roles = roleRepository.findByContentData(contentData);
        List<WordBankItem> wordBank = wordBankItemRepository.findByContentData(contentData);

        Collections.shuffle(roles);
        Collections.shuffle(wordBank);

        List<PlayerSessionEntity> players = session.getPlayers();

        for (int i = 0; i < players.size(); i++) {
            PlayerSessionEntity player = players.get(i);

            if (i < roles.size()) {
                Role role = roles.get(i);
                player.setRole(role);
                role.getPlayerSessions().add(player);
            }

            if (i < wordBank.size()) {
                player.setCurrentWordBomb(wordBank.get(i).getWord());
            }

            playerSessionRepository.save(player);
        }
    }

    public PlayerSessionEntity joinSession(Long sessionId, Long userId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return playerSessionRepository.findBySessionAndUser(session, user)
                .orElseGet(() -> {
                    PlayerSessionEntity player = new PlayerSessionEntity();
                    player.setSession(session);
                    player.setUser(user);
                 //   player.setAvatar(generateAvatar());

                    session.getPlayers().add(player);
                    user.getPlayerSessions().add(player);

                    return playerSessionRepository.save(player);
                });
    }

    public GameSessionEntity endSession(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        session.setStatus(GameSessionEntity.SessionStatus.COMPLETED);
        session.setEndedAt(new Date());

        // Calculate final scores
        calculateFinalScores(session);

        return gameSessionRepository.save(session);
    }

    private void calculateFinalScores(GameSessionEntity session) {
        List<ScoreRecordEntity> records = scoreRecordRepository.findBySessionId(session.getId());
        Map<Long, Integer> userScores = new HashMap<>();

        records.forEach(record -> {
            userScores.merge(record.getUser().getId(), record.getPoints(), Integer::sum);
        });

        session.getPlayers().forEach(player -> {
            player.setTotalScore(userScores.getOrDefault(player.getUser().getId(), 0));
            playerSessionRepository.save(player);
        });
    }

    // ... other helper methods ...
}