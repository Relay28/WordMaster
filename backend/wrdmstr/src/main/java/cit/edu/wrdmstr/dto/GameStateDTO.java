// filepath: backend/wrdmstr/src/main/java/cit/edu/wrdmstr/dto/GameStateDTO.java
package cit.edu.wrdmstr.dto;

import java.util.List;
import java.util.Map;

public class GameStateDTO {
    private Long sessionId;
    private String sessionCode;
    private String status;
    private int currentTurn;
    private int totalTurns;
    private Map<String, Object> currentPlayer; // Should contain id, name, role
    private List<PlayerSessionDTO> players; // Add this field
    private int timeRemaining;
    private List<String> usedWords;
    private Map<String, Object> contentInfo; // e.g., title, description
    private String backgroundImage;
    private List<Map<String, Object>> leaderboard;
    private String storyPrompt;
    private int currentCycle;
    private List<WordBankItemDTO> wordBank;
    private int timePerTurn;
    private int turnCyclesConfig; // To store the configured number of cycles/rounds

    // Getters and Setters for all fields including turnCyclesConfig
    private List<PlayerCardDTO> playerCards;

    // Add getter and setter
    public List<PlayerCardDTO> getPlayerCards() {
        return playerCards;
    }

    public void setPlayerCards(List<PlayerCardDTO> playerCards) {
        this.playerCards = playerCards;
    }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }
    public String getStatus() { return status; }
    public List<PlayerSessionDTO> getPlayers() { return players; } // Add getter
    public void setPlayers(List<PlayerSessionDTO> players) { this.players = players; } // Add setter
    public void setStatus(String status) { this.status = status; }
    public int getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(int currentTurn) { this.currentTurn = currentTurn; }
    public int getTotalTurns() { return totalTurns; }
    public void setTotalTurns(int totalTurns) { this.totalTurns = totalTurns; }
    public Map<String, Object> getCurrentPlayer() { return currentPlayer; }
    public void setCurrentPlayer(Map<String, Object> currentPlayer) { this.currentPlayer = currentPlayer; }
    public int getTimeRemaining() { return timeRemaining; }
    public void setTimeRemaining(int timeRemaining) { this.timeRemaining = timeRemaining; }
    public List<String> getUsedWords() { return usedWords; }
    public void setUsedWords(List<String> usedWords) { this.usedWords = usedWords; }
    public Map<String, Object> getContentInfo() { return contentInfo; }
    public void setContentInfo(Map<String, Object> contentInfo) { this.contentInfo = contentInfo; }
    public String getBackgroundImage() { return backgroundImage; }
    public void setBackgroundImage(String backgroundImage) { this.backgroundImage = backgroundImage; }
    public List<Map<String, Object>> getLeaderboard() { return leaderboard; }
    public void setLeaderboard(List<Map<String, Object>> leaderboard) { this.leaderboard = leaderboard; }
    public String getStoryPrompt() { return storyPrompt; }
    public void setStoryPrompt(String storyPrompt) { this.storyPrompt = storyPrompt; }
    public int getCurrentCycle() { return currentCycle; }
    public void setCurrentCycle(int currentCycle) { this.currentCycle = currentCycle; }
    public List<WordBankItemDTO> getWordBank() { return wordBank; }
    public void setWordBank(List<WordBankItemDTO> wordBank) { this.wordBank = wordBank; }
    public int getTimePerTurn() { return timePerTurn; }
    public void setTimePerTurn(int timePerTurn) { this.timePerTurn = timePerTurn; }
    public int getTurnCyclesConfig() { return turnCyclesConfig; }
    public void setTurnCyclesConfig(int turnCyclesConfig) { this.turnCyclesConfig = turnCyclesConfig; }
}