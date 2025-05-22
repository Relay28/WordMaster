package cit.edu.wrdmstr.dto;

import java.util.Date;
import java.util.List;
import java.util.Map;

public class GameSessionProgressDTO {
    private Long sessionId;
    private String sessionCode;
    private String contentTitle;
    private Date startedAt;
    private StudentProgressDTO progress;

    // Getters and setters

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public String getContentTitle() {
        return contentTitle;
    }

    public void setContentTitle(String contentTitle) {
        this.contentTitle = contentTitle;
    }

    public Date getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Date startedAt) {
        this.startedAt = startedAt;
    }

    public StudentProgressDTO getProgress() {
        return progress;
    }

    public void setProgress(StudentProgressDTO progress) {
        this.progress = progress;
    }
}


