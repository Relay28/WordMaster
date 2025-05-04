package cit.edu.wrdmstr.dto;

public class TurnInfoDTO {
    private int turnNumber;
    private Long playerId;
    private String playerName;
    private String roleName;
    private int timeRemaining;
    private String wordBomb;

    // Getters and setters
    public int getTurnNumber() {
        return turnNumber;
    }

    public void setTurnNumber(int turnNumber) {
        this.turnNumber = turnNumber;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public int getTimeRemaining() {
        return timeRemaining;
    }

    public void setTimeRemaining(int timeRemaining) {
        this.timeRemaining = timeRemaining;
    }

    public String getWordBomb() {
        return wordBomb;
    }

    public void setWordBomb(String wordBomb) {
        this.wordBomb = wordBomb;
    }
}