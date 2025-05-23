package cit.edu.wrdmstr.dto;

public class PlayerSessionDTO {
    private Long id;
    private Long userId;
    private String playerName;
    private String role;
    private int totalScore;

    private String profilePicture;

    private boolean active;

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getPlayerName() {
        return playerName;
    }
    
    public void setName(String playerName) {
        this.playerName = playerName;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public int getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
}