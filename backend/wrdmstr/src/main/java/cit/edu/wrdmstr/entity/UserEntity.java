package cit.edu.wrdmstr.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@NoArgsConstructor // Required for JPA
@AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private long id;

    private String email;

    @JsonIgnore
    private String password;

    @Lob
    private String profilePicture;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<ChatMessageEntity> sentMessages = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<PlayerSessionEntity> playerSessions = new ArrayList<>();


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<ScoreRecordEntity> scoreRecords = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<MessageReactionEntity> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentProgress> studentProgressRecords = new ArrayList<>();

    public List<StudentProgress> getStudentProgressRecords() {
        return studentProgressRecords;
    }

    public void setStudentProgressRecords(List<StudentProgress> studentProgressRecords) {
        this.studentProgressRecords = studentProgressRecords;
    }

    public List<ChatMessageEntity> getSentMessages() {
        return sentMessages;
    }


    public void setSentMessages(List<ChatMessageEntity> sentMessages) {
        this.sentMessages = sentMessages;
    }

    public List<PlayerSessionEntity> getPlayerSessions() {
        return playerSessions;
    }

    public void setPlayerSessions(List<PlayerSessionEntity> playerSessions) {
        this.playerSessions = playerSessions;
    }

    public List<ScoreRecordEntity> getScoreRecords() {
        return scoreRecords;
    }



    public void setScoreRecords(List<ScoreRecordEntity> scoreRecords) {
        this.scoreRecords = scoreRecords;
    }

    public List<MessageReactionEntity> getReactions() {
        return reactions;
    }

    public void setReactions(List<MessageReactionEntity> reactions) {
        this.reactions = reactions;
    }

    private String fname;
    private String lname;

   // @JsonIgnore
    private String role;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean active = true;

   // @JsonManagedReference("user-classrooms")
    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClassroomEntity> taughtClassrooms = new ArrayList<>();

    @JsonManagedReference("user-enrollments")
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentEnrollmentEntity> studentEnrollments = new ArrayList<>();

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public List<ClassroomEntity> getTaughtClassrooms() {
        return taughtClassrooms;
    }

    public void setTaughtClassrooms(List<ClassroomEntity> taughtClassrooms) {
        this.taughtClassrooms = taughtClassrooms;
    }

    public List<StudentEnrollmentEntity> getStudentEnrollments() {
        return studentEnrollments;
    }


    public void setStudentEnrollments(List<StudentEnrollmentEntity> studentEnrollments) {
        this.studentEnrollments = studentEnrollments;
    }
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }




    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getFname() {
        return fname;
    }

    public void setFname(String fname) {
        this.fname = fname;
    }

    public String getLname() {
        return lname;
    }

    public void setLname(String lname) {
        this.lname = lname;
    }

    public String getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setRole(String role) {
        this.role = role;
    }


}
