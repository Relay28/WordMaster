package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.UserRepository;
import cit.edu.wrdmstr.service.WaitingRoomService;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/waiting-room")
public class WaitingRoomController {
    @Autowired
    private WaitingRoomService waitingRoomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameSessionService gameSessionService;

    @PostMapping("/content/{contentId}/join")
    public ResponseEntity<?> joinWaitingRoom(
            @PathVariable Long contentId,
            Authentication auth) {
        String email = auth.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        waitingRoomService.joinWaitingRoom(
                contentId,
                user.getId(),
                user.getFname() + " " + user.getLname()
        );

        return ResponseEntity.ok().build();
    }

    @GetMapping("/content/{contentId}/students")
    public ResponseEntity<List<UserDto>> getWaitingStudents(
            @PathVariable Long contentId) {
        return ResponseEntity.ok(waitingRoomService.getWaitingStudents(contentId));
    }

    @PostMapping("/content/{contentId}/start")
    public ResponseEntity<?> startGame(
            @PathVariable Long contentId,
            Authentication auth) {
        List<GameSessionEntity> sessions = waitingRoomService.startGameWithWaitingStudents(contentId, auth);
        return ResponseEntity.ok(sessions.stream()
                .map(gameSessionService::toDTO)
                .collect(Collectors.toList()));
    }
}