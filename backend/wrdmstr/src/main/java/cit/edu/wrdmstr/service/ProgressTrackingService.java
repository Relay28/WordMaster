package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.*;
import jakarta.transaction.Transactional;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class ProgressTrackingService {
    private static final Logger logger = LoggerFactory.getLogger(ProgressTrackingService.class);

    @Autowired
    private StudentProgressRepository progressRepository;
    @Autowired private ProgressSnapshotRepository snapshotRepository;
    @Autowired private PlayerSessionEntityRepository playerRepository;
    @Autowired private ChatMessageEntityRepository chatMessageRepository;
    @Autowired private GameSessionEntityRepository gameSessionRepository;

    public void trackSessionProgress(Long sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        List<PlayerSessionEntity> players = playerRepository.findBySessionId(sessionId);

        for (PlayerSessionEntity player : players) {
            trackPlayerProgress(player, session);
        }
    }
    public void trackTurnProgress(Long sessionId, Long playerId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        PlayerSessionEntity player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found"));

        // Get all messages for this player
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(playerId);

        // Calculate metrics
        double grammarAccuracy = calculateGrammarAccuracy(messages);
        double wordBombUsageRate = calculateWordBombUsageRate(messages);
        double comprehensionScore = calculateComprehensionScore(messages);
        double turnCompletionRate = calculateTurnCompletionRate(player, session);

        // Get or create progress record
        StudentProgress progress = progressRepository.findByStudentIdAndSessionId(
                        player.getUser().getId(), session.getId())
                .orElseGet(() -> {
                    StudentProgress newProgress = new StudentProgress();
                    newProgress.setStudent(player.getUser());
                    newProgress.setSession(session);
                    newProgress.setCreatedAt(new Date());
                    return newProgress;
                });

        // Update all metrics
        progress.setGrammarAccuracy(grammarAccuracy);
        progress.setWordBombUsageRate(wordBombUsageRate);
        progress.setComprehensionScore(comprehensionScore);
        progress.setTurnCompletionRate(turnCompletionRate);
        progress.setUpdatedAt(new Date());

        // Save the progress
        progressRepository.save(progress);

        // Save snapshots
        saveProgressSnapshot(progress, "GRAMMAR_ACCURACY", grammarAccuracy);
        saveProgressSnapshot(progress, "WORD_BOMB_USAGE", wordBombUsageRate);
        saveProgressSnapshot(progress, "COMPREHENSION", comprehensionScore);
        saveProgressSnapshot(progress, "TURN_COMPLETION", turnCompletionRate);
    }

    private double calculateGrammarAccuracy(List<ChatMessageEntity> messages) {
        if (messages.isEmpty()) return 0.0;

        long perfectCount = messages.stream()
                .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
                .count();

        return (perfectCount * 100.0) / messages.size();
    }

    private double calculateWordBombUsageRate(List<ChatMessageEntity> messages) {
        if (messages.isEmpty()) return 0.0;

        long wordBombCount = messages.stream()
                .filter(ChatMessageEntity::isContainsWordBomb)
                .count();

        return (wordBombCount * 100.0) / messages.size();
    }

    private double calculateComprehensionScore(List<ChatMessageEntity> messages) {
        if (messages.isEmpty()) return 0.0;

        // This is a simplified version - you might want to implement more sophisticated
        // comprehension scoring based on message content analysis
        long relevantCount = messages.stream()
                .filter(m -> m.getContent().length() > 10) // Simple heuristic
                .count();

        return (relevantCount * 100.0) / messages.size();
    }


    private void saveProgressSnapshot(StudentProgress progress, String metricType, double value) {
        try {
            // Ensure the progress entity is properly initialized
            if (progress.getSession() == null || progress.getStudent() == null) {
                logger.error("Cannot save snapshot - StudentProgress is missing required fields");
                return;
            }

            ProgressSnapshot snapshot = new ProgressSnapshot();
            snapshot.setProgress(progress);
            snapshot.setMetricType(metricType);
            snapshot.setMetricValue(value);

            snapshotRepository.save(snapshot);

            // Also add to the progress entity's snapshot collection
            if (progress.getSnapshots() == null) {
                progress.setSnapshots(new ArrayList<>());
            }
            progress.getSnapshots().add(snapshot);
        } catch (Exception e) {
            logger.error("Failed to save progress snapshot for student {}: {}",
                    progress.getStudent() != null ? progress.getStudent().getId() : "null",
                    e.getMessage());
        }
    }



    // Enhance the existing trackPlayerProgress method
    private void trackPlayerProgress(PlayerSessionEntity player, GameSessionEntity session) {
        StudentProgress progress = progressRepository.findByStudentIdAndSessionId(
                        player.getUser().getId(), session.getId())
                .orElseGet(() -> {
                    StudentProgress newProgress = new StudentProgress();
                    newProgress.setStudent(player.getUser());
                    newProgress.setSession(session);
                    return newProgress;
                });

        // Always update these metrics
        progress.setTurnCompletionRate(calculateTurnCompletionRate(player, session));
        progress.setAvgResponseTime(calculateAvgResponseTime(player, session));
        progress.setGrammarAccuracy(calculateGrammarAccuracy(player, session));
        progress.setWordBombUsageRate(calculateWordBombUsageRate(player, session));
        progress.setComprehensionScore(calculateComprehensionScore(player, session));

        // Update cumulative counts
        progress.setTotalMessages(calculateMessagesSent(player));
        progress.setTotalWordsUsed(calculateWordsUsed(player));
        progress.setTotalPerfectGrammar(calculatePerfectGrammarCount(player));

        // Calculate word bomb usage count
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        long wordBombCount = messages.stream()
                .filter(ChatMessageEntity::isContainsWordBomb)
                .count();
        progress.setTotalWordBombsUsed((int)wordBombCount);

        progress.setUpdatedAt(new Date());
        progressRepository.save(progress);

        // Save snapshots
        saveProgressSnapshot(progress, "TURN_COMPLETION", progress.getTurnCompletionRate());
        saveProgressSnapshot(progress, "GRAMMAR_ACCURACY", progress.getGrammarAccuracy());
        saveProgressSnapshot(progress, "WORD_BOMB_USAGE", progress.getWordBombUsageRate());
    }




    private double calculateTotalScore(StudentProgress progress) {
        // Weighted score calculation
        double score = 0;
        score += progress.getTurnCompletionRate() * 0.2;
        score += (100 - Math.min(progress.getAvgResponseTime(), 60)) * 0.15; // Faster response = higher score
        score += progress.getGrammarAccuracy() * 0.25;
        score += progress.getComprehensionScore() * 0.2;
        score += progress.getWordBombUsageRate() * 0.1;
        score += progress.getWordsUsed() * 0.05;
        score += progress.getPerfectGrammarCount() * 0.05;
        return score;
    }

    private double calculateAvgResponseTime(PlayerSessionEntity player, GameSessionEntity session) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        if (messages.isEmpty()) return 0.0;

        // Calculate average time between messages
        double totalTime = 0;
        ChatMessageEntity prevMessage = null;
        for (ChatMessageEntity message : messages) {
            if (prevMessage != null) {
                long diff = message.getTimestamp().getTime() - prevMessage.getTimestamp().getTime();
                totalTime += diff / 1000.0; // convert to seconds
            }
            prevMessage = message;
        }

        return messages.size() > 1 ? totalTime / (messages.size() - 1) : 0.0;
    }

    private int calculateWordsUsed(PlayerSessionEntity player) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        return messages.stream()
                .mapToInt(m -> m.getContent().split("\\s+").length)
                .sum();
    }

    private int calculateMessagesSent(PlayerSessionEntity player) {
        return chatMessageRepository.countByPlayerSessionId(player.getId());
    }

    private int calculatePerfectGrammarCount(PlayerSessionEntity player) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        return (int) messages.stream()
                .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
                .count();
    }

    private double calculateTurnCompletionRate(PlayerSessionEntity player, GameSessionEntity session) {
        int playerTurns = chatMessageRepository.countByPlayerSessionId(player.getId());
        int totalTurns = session.getTotalTurns();

        if (totalTurns <= 0) return 0.0;

        // Cap at 100%
        return Math.min(100.0, (playerTurns * 100.0) / totalTurns);
    }



    private double calculateGrammarAccuracy(PlayerSessionEntity player, GameSessionEntity session) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        if (messages.isEmpty()) return 0.0;

        long perfectCount = messages.stream()
                .filter(m -> m.getGrammarStatus() == ChatMessageEntity.MessageStatus.PERFECT)
                .count();

        return (perfectCount * 100.0) / messages.size();
    }

    private double calculateWordBombUsageRate(PlayerSessionEntity player, GameSessionEntity session) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        if (messages.isEmpty()) return 0.0;

        long wordBombUsedCount = messages.stream()
                .filter(ChatMessageEntity::isContainsWordBomb)
                .count();

        return (wordBombUsedCount * 100.0) / messages.size();
    }

    // In ProgressTrackingService
    public double calculateComprehensionScore(PlayerSessionEntity player, GameSessionEntity session) {
        List<ChatMessageEntity> messages = chatMessageRepository.findByPlayerSessionId(player.getId());
        if (messages.isEmpty()) return 0.0;

        long appropriateCount = messages.stream()
                .filter(ChatMessageEntity::isRoleAppropriate)
                .count();

        return (appropriateCount * 100.0) / messages.size();
    }

    public List<ProgressSnapshot> getProgressTrend(Long studentId, Long sessionId, String metricType) {
        return snapshotRepository.findByProgressStudentIdAndProgressSessionIdAndMetricTypeOrderByRecordedAtAsc(
                studentId, sessionId, metricType);
    }

    public StudentProgress getStudentProgress(Long studentId, Long sessionId) {
        return progressRepository.findByStudentIdAndSessionId(studentId, sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Progress data not found"));
    }
}