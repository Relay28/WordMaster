package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.GameSessionEntity;
import cit.edu.wrdmstr.repository.GameSessionEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class ProgressTrackingScheduler {
    private static final Logger logger = LoggerFactory.getLogger(ProgressTrackingScheduler.class);

    @Autowired
    private ProgressTrackingService progressTrackingService;
    @Autowired
    private GameSessionEntityRepository gameSessionRepository;

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void trackActiveSessionsProgress() {
        List<GameSessionEntity> activeSessions = gameSessionRepository.findByStatus(GameSessionEntity.SessionStatus.ACTIVE);

        for (GameSessionEntity session : activeSessions) {
            try {
                logger.info("Tracking progress for active session: {}", session.getId());
                progressTrackingService.trackSessionProgress(session.getId());
            } catch (Exception e) {
                logger.error("Error tracking progress for session {}: {}", session.getId(), e.getMessage());
            }
        }
    }
}