package cit.edu.wrdmstr.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class ClassroomEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String enrollmentCode;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentEnrollmentEntity> enrollments = new ArrayList<>();

    public List<StudentEnrollmentEntity> getEnrollments() {
        return enrollments;
    }

    public void setEnrollments(List<StudentEnrollmentEntity> enrollments) {
        this.enrollments = enrollments;
    }

    @ManyToMany
    @JoinTable(
            name = "classroom_students",
            joinColumns = @JoinColumn(name = "classroom_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private Set<UserEntity> students = new HashSet<>();

    // Helper methods for managing relationships
    public void addStudent(UserEntity student) {
        StudentEnrollmentEntity enrollment = new StudentEnrollmentEntity();
        enrollment.setClassroom(this);
        enrollment.setStudent(student);
        enrollments.add(enrollment);
        student.getStudentEnrollments().add(enrollment);
    }

    public void removeStudent(UserEntity student) {
        StudentEnrollmentEntity enrollment = enrollments.stream()
                .filter(e -> e.getStudent().equals(student))
                .findFirst()
                .orElse(null);
        if (enrollment != null) {
            enrollments.remove(enrollment);
            student.getStudentEnrollments().remove(enrollment);
            enrollment.setClassroom(null);
            enrollment.setStudent(null);
        }
    }



    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEnrollmentCode() {
        return enrollmentCode;
    }

    public void setEnrollmentCode(String enrollmentCode) {
        this.enrollmentCode = enrollmentCode;
    }

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public Set<UserEntity> getStudents() {
        return students;
    }

    public void setStudents(Set<UserEntity> students) {
        this.students = students;
    }
}