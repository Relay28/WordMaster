package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.GameSessionEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WaitingRoomService {
    private final Map<Long, Set<UserDto>> waitingRooms = new ConcurrentHashMap<>();

    @Autowired
    private GameSessionService gameSessionService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GameSessionEntityRepository gameSessionEntityRepository;
    @Autowired
    private ContentRepository contentRepository;
    @Autowired
    private PlayerSessionEntityRepository playerSessionRepository;

    public synchronized void joinWaitingRoom(Long contentId, Long userId, String userName) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Only allow students to join waiting room
        if ("USER_STUDENT".equals(user.getRole())) {
            waitingRooms.putIfAbsent(contentId, ConcurrentHashMap.newKeySet());
            UserDto userDto = new UserDto();
            userDto.setId(userId);
            userDto.setFname(userName);
            userDto.setRole(user.getRole());
            waitingRooms.get(contentId).add(userDto);
            notifyWaitingRoomUpdate(contentId);
        }
    }

    private void notifyWaitingRoomUpdate(Long contentId) {
        List<UserDto> students = new ArrayList<>(waitingRooms.get(contentId));
        messagingTemplate.convertAndSend("/topic/waiting-room/" + contentId, students);
    }

    public synchronized void removeFromWaitingRoom(Long contentId, Long userId) {
        Set<UserDto> students = waitingRooms.get(contentId);
        if (students != null) {
            students.removeIf(student -> student.getId().equals(userId));
            notifyWaitingRoomUpdate(contentId);
        }
    }

    public List<UserDto> getWaitingStudents(Long contentId) {
        return new ArrayList<>(waitingRooms.getOrDefault(contentId, ConcurrentHashMap.newKeySet()));
    }

    @Transactional
    public List<GameSessionEntity> startGameWithWaitingStudents(Long contentId, Authentication auth) {
        ContentEntity content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));

        Set<UserDto> waitingStudents = waitingRooms.get(contentId);
        if (waitingStudents == null || waitingStudents.isEmpty()) {
            throw new IllegalStateException("No students in waiting room");
        }

        int studentsPerGroup = content.getGameConfig().getStudentsPerGroup();
        List<GameSessionEntity> sessions = new ArrayList<>();
        List<UserDto> studentsList = new ArrayList<>(waitingStudents);

        // Split students into groups and create sessions
        for (int i = 0; i < studentsList.size(); i += studentsPerGroup) {
            int end = Math.min(i + studentsPerGroup, studentsList.size());
            List<UserDto> groupStudents = studentsList.subList(i, end);

            // Create game session for this group
            GameSessionEntity session = gameSessionService.createSession(contentId, auth);
            session.setStatus(GameSessionEntity.SessionStatus.ACTIVE);
            session.setStartedAt(new Date());
            session = gameSessionEntityRepository.save(session);

            // Add students to session
            for (UserDto studentDto : groupStudents) {
                UserEntity student = userRepository.findById(studentDto.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));;
                PlayerSessionEntity playerSession = new PlayerSessionEntity();
                playerSession.setSession(session);
                playerSession.setUser(student);
                playerSession.setActive(true);
                playerSession.setGroupNumber(sessions.size() + 1); // Set group number
                playerSessionRepository.save(playerSession);
                session.addPlayer(playerSession);
            }

            sessions.add(session);

            // Notify participants of this group
            messagingTemplate.convertAndSend("/topic/game-start/" + contentId,
                    Map.of("sessionId", session.getId(), "groupNumber", sessions.size()));
        }

        // Clear waiting room after all sessions are created
        waitingRooms.remove(contentId);

        return sessions;
    }
}