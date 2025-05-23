package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;
import java.util.Map;

public class TeacherFeedbackDTO {
    private Long id;
    private Long gameSessionId;
    private Long studentId;
    private String studentName;
    private Long teacherId;
    private String teacherName;
    private String feedback;
    private Integer comprehensionScore;
    private Integer participationScore;
    private Integer languageUseScore;
    private Integer roleAdherenceScore;
    private String overallGrade;
    private Date createdAt;
    private Date updatedAt;
    private String aiSuggestedFeedback;
    
    // Performance statistics
    private Integer totalScore;
    private Integer messageCount;
    private Integer perfectGrammarCount;
    private Integer wordBankUsageCount;
    private Integer vocabularyScore;

    
    // Comprehension check data
    private List<Map<String, Object>> comprehensionQuestions;
    private List<Map<String, Object>> comprehensionAnswers;
    private Double comprehensionPercentage;
    
    // Grade statistics
    private Map<String, Object> scoreBreakdown;
    private List<Map<String, Object>> messageAnalysis;
    
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
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    
    public Integer getComprehensionScore() {
        return comprehensionScore;
    }
    
    public void setComprehensionScore(Integer comprehensionScore) {
        this.comprehensionScore = comprehensionScore;
    }
    
    public Integer getParticipationScore() {
        return participationScore;
    }
    
    public void setParticipationScore(Integer participationScore) {
        this.participationScore = participationScore;
    }
    
    public Integer getLanguageUseScore() {
        return languageUseScore;
    }
    
    public void setLanguageUseScore(Integer languageUseScore) {
        this.languageUseScore = languageUseScore;
    }
    
    public Integer getRoleAdherenceScore() {
        return roleAdherenceScore;
    }
    
    public void setRoleAdherenceScore(Integer roleAdherenceScore) {
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
    
    public Date getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getAiSuggestedFeedback() {
        return aiSuggestedFeedback;
    }
    
    public void setAiSuggestedFeedback(String aiSuggestedFeedback) {
        this.aiSuggestedFeedback = aiSuggestedFeedback;
    }
    
    public Integer getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }
    
    public Integer getMessageCount() {
        return messageCount;
    }
    
    public void setMessageCount(Integer messageCount) {
        this.messageCount = messageCount;
    }
    
    public Integer getPerfectGrammarCount() {
        return perfectGrammarCount;
    }
    
    public void setPerfectGrammarCount(Integer perfectGrammarCount) {
        this.perfectGrammarCount = perfectGrammarCount;
    }
    
    public Integer getWordBankUsageCount() {
        return wordBankUsageCount;
    }
    
    public void setWordBankUsageCount(Integer wordBankUsageCount) {
        this.wordBankUsageCount = wordBankUsageCount;
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
    
    public Map<String, Object> getScoreBreakdown() {
        return scoreBreakdown;
    }
    
    public void setScoreBreakdown(Map<String, Object> scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }
    
    public List<Map<String, Object>> getMessageAnalysis() {
        return messageAnalysis;
    }
    
    public void setMessageAnalysis(List<Map<String, Object>> messageAnalysis) {
        this.messageAnalysis = messageAnalysis;
    }

    public Integer getVocabularyScore() {
        return vocabularyScore;
    }

    public void setVocabularyScore(Integer vocabularyScore) {
        this.vocabularyScore = vocabularyScore;
    }
}