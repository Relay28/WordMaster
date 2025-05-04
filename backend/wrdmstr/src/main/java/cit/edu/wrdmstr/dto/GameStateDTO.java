package cit.edu.wrdmstr.dto;

import java.util.List;
import java.util.Map;

public class GameStateDTO {
    private Long sessionId;
    private String status;
    private int currentTurn;
    private int totalTurns;
    private Map<String, Object> currentPlayer;
    private int timeRemaining;
    private List<String> usedWords;
    private Map<String, Object> contentInfo;
    private String backgroundImage;
    private List<Map<String, Object>> leaderboard;

    // Getters and setters
    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(int currentTurn) {
        this.currentTurn = currentTurn;
    }

    public int getTotalTurns() {
        return totalTurns;
    }

    public void setTotalTurns(int totalTurns) {
        this.totalTurns = totalTurns;
    }

    public Map<String, Object> getCurrentPlayer() {
        return currentPlayer;
    }

    public void setCurrentPlayer(Map<String, Object> currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public int getTimeRemaining() {
        return timeRemaining;
    }

    public void setTimeRemaining(int timeRemaining) {
        this.timeRemaining = timeRemaining;
    }

    public List<String> getUsedWords() {
        return usedWords;
    }

    public void setUsedWords(List<String> usedWords) {
        this.usedWords = usedWords;
    }

    public Map<String, Object> getContentInfo() {
        return contentInfo;
    }

    public void setContentInfo(Map<String, Object> contentInfo) {
        this.contentInfo = contentInfo;
    }

    public String getBackgroundImage() {
        return backgroundImage;
    }

    public void setBackgroundImage(String backgroundImage) {
        this.backgroundImage = backgroundImage;
    }

    public List<Map<String, Object>> getLeaderboard() {
        return leaderboard;
    }

    public void setLeaderboard(List<Map<String, Object>> leaderboard) {
        this.leaderboard = leaderboard;
    }
}