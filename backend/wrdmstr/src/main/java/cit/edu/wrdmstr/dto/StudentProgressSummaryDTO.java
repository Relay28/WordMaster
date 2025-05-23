package cit.edu.wrdmstr.dto;

import java.util.List;

// For individual student progress in class view
public class StudentProgressSummaryDTO {
    private Long studentId;
    private String studentName;
    private List<GameSessionProgressDTO> sessions;

    // Getters and setters


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

    public List<GameSessionProgressDTO> getSessions() {
        return sessions;
    }

    public void setSessions(List<GameSessionProgressDTO> sessions) {
        this.sessions = sessions;
    }
}