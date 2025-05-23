package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;
import java.util.Map;

public class ComprehensionResultDTO {
    private Long id;
    private Long gameSessionId;
    private Long studentId;
    private String studentName;
    private List<Map<String, Object>> comprehensionQuestions;
    private List<Map<String, Object>> comprehensionAnswers;
    private Double comprehensionPercentage;
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

    public List<Map<String, Object>> getComprehensionQuestions() {
        return comprehensionQuestions;
    }

    public void setComprehensionQuestions(List<Map<String, Object>> comprehensionQuestions) {
        this.comprehensionQuestions = comprehensionQuestions;
    }

    public List<Map<String, Object>> getComprehensionAnswers() {
        return comprehensionAnswers;
    }

    public void setComprehensionAnswers(List<Map<String, Object>> comprehensionAnswers) {
        this.comprehensionAnswers = comprehensionAnswers;
    }

    public Double getComprehensionPercentage() {
        return comprehensionPercentage;
    }

    public void setComprehensionPercentage(Double comprehensionPercentage) {
        this.comprehensionPercentage = comprehensionPercentage;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}