package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.UserRepository;
import cit.edu.wrdmstr.service.ProgressTrackingService;
import cit.edu.wrdmstr.service.UserService;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress")
@PreAuthorize("isAuthenticated()")
@CrossOrigin(origins = "https://wordmaster-nu.vercel.app")
public class ProgressTrackingController {
    private static final Logger logger = LoggerFactory.getLogger(ProgressTrackingController.class);

    @Autowired private ProgressTrackingService progressService;
    @Autowired private GameSessionService gameSessionService;
    @Autowired private UserService userService;

    // Student Endpoints

    @GetMapping("/student/game-history")
    public ResponseEntity<List<GameSessionProgressDTO>> getStudentGameHistory(
            Authentication auth) {
        try {
            UserEntity student = userService.findByEmail(auth.getName());
            logger.info("Logging in Student {}", student.getEmail());
            List<GameSessionEntity> sessions = gameSessionService.getSessionsByStudentId(student.getId());
            logger.info("Sessions Found {}", sessions.size());
            List<GameSessionProgressDTO> result = sessions.stream()
                    .map(session -> {
                        GameSessionProgressDTO dto = new GameSessionProgressDTO();
                        dto.setSessionId(session.getId());
                        dto.setSessionCode(session.getSessionCode());
                        dto.setContentTitle(session.getContent() != null ?
                                session.getContent().getTitle() : "No Title");
                        dto.setStartedAt(session.getStartedAt());
                        return dto;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting student game history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/student/session/{sessionId}")
    public ResponseEntity<GameSessionProgressDTO> getStudentSessionProgress(
            Authentication auth, @PathVariable Long sessionId) {
        try {
            UserEntity student = userService.findByEmail(auth.getName());
            StudentProgress progress = progressService.getStudentProgress(student.getId(), sessionId);
            GameSessionEntity session = gameSessionService.getSessionById(sessionId);

            GameSessionProgressDTO dto = new GameSessionProgressDTO();
            dto.setSessionId(session.getId());
            dto.setSessionCode(session.getSessionCode());
            dto.setContentTitle(session.getContent() != null ?
                    session.getContent().getTitle() : "No Title");
            dto.setStartedAt(session.getStartedAt());

            StudentProgressDTO progressDTO = new StudentProgressDTO();
            progressDTO.setTurnCompletionRate(progress.getTurnCompletionRate());
            progressDTO.setAvgResponseTime(progress.getAvgResponseTime());
            progressDTO.setGrammarAccuracy(progress.getGrammarAccuracy());
            progressDTO.setWordBombUsageRate(progress.getWordBombUsageRate());
            progressDTO.setComprehensionScore(progress.getComprehensionScore());

            // Get trends
            Map<String, List<ProgressTrendPointDTO>> trends = new HashMap<>();
            for (String metric : Arrays.asList("TURN_COMPLETION", "GRAMMAR_ACCURACY",
                    "WORD_BOMB_USAGE", "COMPREHENSION")) {
                trends.put(metric,
                        progressService.getProgressTrend(student.getId(), sessionId, metric)
                                .stream()
                                .map(s -> new ProgressTrendPointDTO(s.getRecordedAt(), s.getMetricValue()))
                                .collect(Collectors.toList())
                );
            }
            progressDTO.setTrends(trends);
            dto.setProgress(progressDTO);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Error getting progress", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Teacher Endpoints

    @GetMapping("/teacher/session/{sessionId}/students")
    public ResponseEntity<List<StudentProgressSummaryDTO>> getSessionStudentsProgress(
            Authentication auth,
            @PathVariable Long sessionId) {
        try {
            UserEntity teacher = userService.findByEmail(auth.getName());
            GameSessionEntity session = gameSessionService.getSessionById(sessionId);

            // Verify teacher owns this session
            if (!(session.getTeacher().getId() ==(teacher.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<PlayerSessionEntity> players = session.getPlayers();
            List<StudentProgressSummaryDTO> result = new ArrayList<>();

            for (PlayerSessionEntity player : players) {
                StudentProgressSummaryDTO summary = new StudentProgressSummaryDTO();
                summary.setStudentId(player.getUser().getId());
                summary.setStudentName(player.getUser().getFname() + " " + player.getUser().getLname());

                StudentProgress progress = progressService.getStudentProgress(
                        player.getUser().getId(), sessionId);

                GameSessionProgressDTO sessionProgress = new GameSessionProgressDTO();
                sessionProgress.setSessionId(session.getId());
                sessionProgress.setSessionCode(session.getSessionCode());
                sessionProgress.setContentTitle(session.getContent() != null ?
                        session.getContent().getTitle() : "No Title");
                sessionProgress.setStartedAt(session.getStartedAt());

                StudentProgressDTO progressDTO = new StudentProgressDTO();
                progressDTO.setTurnCompletionRate(progress.getTurnCompletionRate());
                progressDTO.setAvgResponseTime(progress.getAvgResponseTime());
                progressDTO.setGrammarAccuracy(progress.getGrammarAccuracy());
                progressDTO.setWordBombUsageRate(progress.getWordBombUsageRate());
                progressDTO.setComprehensionScore(progress.getComprehensionScore());

                sessionProgress.setProgress(progressDTO);
                summary.setSessions(Collections.singletonList(sessionProgress));

                result.add(summary);
            }

            return ResponseEntity.ok(result);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting session students progress", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/teacher/student/{studentId}/progress")
    public ResponseEntity<StudentProgressSummaryDTO> getStudentProgressHistory(
            Authentication auth,
            @PathVariable Long studentId) {
        try {
            UserEntity teacher = userService.findByEmail(auth.getName());
            UserEntity student = userService.getUserById(studentId);

            // Verify teacher-student relationship (you might need additional checks here)
            // For example, check if they share any classrooms

            List<GameSessionEntity> sessions = gameSessionService.getSessionsByStudentId(studentId);

            StudentProgressSummaryDTO summary = new StudentProgressSummaryDTO();
            summary.setStudentId(student.getId());
            summary.setStudentName(student.getFname() + " " + student.getLname());

            List<GameSessionProgressDTO> sessionProgressList = sessions.stream()
                    .map(session -> {
                        StudentProgress progress = progressService.getStudentProgress(
                                student.getId(), session.getId());

                        GameSessionProgressDTO dto = new GameSessionProgressDTO();
                        dto.setSessionId(session.getId());
                        dto.setSessionCode(session.getSessionCode());
                        dto.setContentTitle(session.getContent() != null ?
                                session.getContent().getTitle() : "No Title");
                        dto.setStartedAt(session.getStartedAt());

                        StudentProgressDTO progressDTO = new StudentProgressDTO();
                        progressDTO.setTurnCompletionRate(progress.getTurnCompletionRate());
                        progressDTO.setAvgResponseTime(progress.getAvgResponseTime());
                        progressDTO.setGrammarAccuracy(progress.getGrammarAccuracy());
                        progressDTO.setWordBombUsageRate(progress.getWordBombUsageRate());
                        progressDTO.setComprehensionScore(progress.getComprehensionScore());

                        dto.setProgress(progressDTO);
                        return dto;
                    })
                    .collect(Collectors.toList());

            summary.setSessions(sessionProgressList);
            return ResponseEntity.ok(summary);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting student progress history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}