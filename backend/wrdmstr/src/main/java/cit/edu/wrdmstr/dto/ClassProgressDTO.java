package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;

// For class progress overview
public class ClassProgressDTO {
    private Long sessionId;
    private String contentTitle;
    private Date sessionDate;
    private double avgTurnCompletionRate;
    private double avgGrammarAccuracy;
    private List<StudentProgressSummaryDTO> studentProgress;
    // getters and setters


    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getContentTitle() {
        return contentTitle;
    }

    public void setContentTitle(String contentTitle) {
        this.contentTitle = contentTitle;
    }

    public Date getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(Date sessionDate) {
        this.sessionDate = sessionDate;
    }

    public double getAvgTurnCompletionRate() {
        return avgTurnCompletionRate;
    }

    public void setAvgTurnCompletionRate(double avgTurnCompletionRate) {
        this.avgTurnCompletionRate = avgTurnCompletionRate;
    }

    public double getAvgGrammarAccuracy() {
        return avgGrammarAccuracy;
    }

    public void setAvgGrammarAccuracy(double avgGrammarAccuracy) {
        this.avgGrammarAccuracy = avgGrammarAccuracy;
    }

    public List<StudentProgressSummaryDTO> getStudentProgress() {
        return studentProgress;
    }

    public void setStudentProgress(List<StudentProgressSummaryDTO> studentProgress) {
        this.studentProgress = studentProgress;
    }
}
