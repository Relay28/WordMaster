package cit.edu.wrdmstr.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
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


    private String fname;
    private String lname;

    @JsonIgnore
    private String role;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean active = true;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClassroomEntity> taughtClassrooms = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentEnrollmentEntity> studentEnrollments = new ArrayList<>();

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
