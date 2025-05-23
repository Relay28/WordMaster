package cit.edu.wrdmstr.dto;

import java.util.Date;

public class StudentFeedbackSummaryDTO {
    private Long id;
    private Long sessionId;
    private Long studentId;
    private Long teacherId;
    private String teacherName;
    private String gameTitle;
    private String feedback;
    private int comprehensionScore;
    private int participationScore;
    private int languageUseScore;
    private int roleAdherenceScore;
    private String overallGrade;
    private Date createdAt;
    private int vocabularyScore;
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
    
    public Long getTeacherId() {
        return teacherId;
    }
    
    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }
    
    public String getTeacherName() {
        return teacherName;
    }
    
    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }
    
    public String getGameTitle() {
        return gameTitle;
    }
    
    public void setGameTitle(String gameTitle) {
        this.gameTitle = gameTitle;
    }
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    
    public int getComprehensionScore() {
        return comprehensionScore;
    }
    
    public void setComprehensionScore(int comprehensionScore) {
        this.comprehensionScore = comprehensionScore;
    }
    
    public int getParticipationScore() {
        return participationScore;
    }
    
    public void setParticipationScore(int participationScore) {
        this.participationScore = participationScore;
    }
    
    public int getLanguageUseScore() {
        return languageUseScore;
    }
    
    public void setLanguageUseScore(int languageUseScore) {
        this.languageUseScore = languageUseScore;
    }
    
    public int getRoleAdherenceScore() {
        return roleAdherenceScore;
    }
    
    public void setRoleAdherenceScore(int roleAdherenceScore) {
        this.roleAdherenceScore = roleAdherenceScore;
    }
    
    public String getOverallGrade() {
        return overallGrade;
    }
    
    public void setOverallGrade(String overallGrade) {
        this.overallGrade = overallGrade;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public int getVocabularyScore() {
        return vocabularyScore;
    }

    public void setVocabularyScore(int vocabularyScore) {
        this.vocabularyScore = vocabularyScore;
    }
}