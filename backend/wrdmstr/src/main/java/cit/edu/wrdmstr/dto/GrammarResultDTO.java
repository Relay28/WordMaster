package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class GrammarResultDTO {
    private Long id;
    private Long gameSessionId;
    private Long studentId;
    private String studentName;
    private int perfectCount;
    private int minorErrorsCount;
    private int majorErrorsCount;
    private int grammarStreak;
    private double grammarAccuracy;
    private Date createdAt;
    
    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGameSessionId() {
        return gameSessionId;
    }

    public void setGameSessionId(Long gameSessionId) {
        this.gameSessionId = gameSessionId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public int getPerfectCount() {
        return perfectCount;
    }

    public void setPerfectCount(int perfectCount) {
        this.perfectCount = perfectCount;
    }

    public int getMinorErrorsCount() {
        return minorErrorsCount;
    }

    public void setMinorErrorsCount(int minorErrorsCount) {
        this.minorErrorsCount = minorErrorsCount;
    }

    public int getMajorErrorsCount() {
        return majorErrorsCount;
    }

    public void setMajorErrorsCount(int majorErrorsCount) {
        this.majorErrorsCount = majorErrorsCount;
    }

    public int getGrammarStreak() {
        return grammarStreak;
    }

    public void setGrammarStreak(int grammarStreak) {
        this.grammarStreak = grammarStreak;
    }

    public double getGrammarAccuracy() {
        return grammarAccuracy;
    }

    public void setGrammarAccuracy(double grammarAccuracy) {
        this.grammarAccuracy = grammarAccuracy;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    // Utility method to get grammar breakdown as a map
    public Map<String, Integer> getGrammarBreakdown() {
        Map<String, Integer> breakdown = new HashMap<>();
        breakdown.put("PERFECT", perfectCount);
        breakdown.put("MINOR_ERRORS", minorErrorsCount);
        breakdown.put("MAJOR_ERRORS", majorErrorsCount);
        return breakdown;
    }
}