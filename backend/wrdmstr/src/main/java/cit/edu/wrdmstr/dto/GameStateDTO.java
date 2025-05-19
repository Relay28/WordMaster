package cit.edu.wrdmstr.dto;

import java.util.List;
import java.util.Map;

public class GameStateDTO {
    private Long sessionId;
    private String sessionCode; // Add this field
    private String status;
    private int currentTurn;
    private int totalTurns;
    private Map<String, Object> currentPlayer;
    private int timeRemaining;
    private List<String> usedWords;
    private Map<String, Object> contentInfo;
    private String backgroundImage;
    private List<Map<String, Object>> leaderboard;
    
    // Add current cycle field
    private int currentCycle;

    // Add this field to the class
    private List<String> wordBank;

    // Add these fields if they don't exist
    private int timePerTurn;

    // Getters and setters
    public Long getSessionId() {
        return sessionId;
    }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }
        private List<PlayerSessionDTO> players;

        public List<PlayerSessionDTO> getPlayers() {
            return players;
        }

    // Make sure the PlayerSessionDTO includes role information
    public void setPlayers(List<PlayerSessionDTO> players) {
        this.players = players;
        // Add debug logging
        if (players != null) {
            for (PlayerSessionDTO player : players) {
                System.out.println("Player: " + player.getPlayerName() + ", Role: " + player.getRole());
            }
        }
    }
        
    // Add these methods
    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
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

    // Add getter and setter for current cycle
    public int getCurrentCycle() {
        return currentCycle;
    }

    public void setCurrentCycle(int currentCycle) {
        this.currentCycle = currentCycle;
    }

    public List<String> getWordBank() {
        return wordBank;
    }

    public void setWordBank(List<String> wordBank) {
        this.wordBank = wordBank;
    }

    // Add these getter and setter methods
    public int getTimePerTurn() {
        return timePerTurn;
    }

    public void setTimePerTurn(int timePerTurn) {
        this.timePerTurn = timePerTurn;
    }
}