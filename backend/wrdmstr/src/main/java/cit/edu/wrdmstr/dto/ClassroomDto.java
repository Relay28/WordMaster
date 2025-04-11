package cit.edu.wrdmstr.dto;

import cit.edu.wrdmstr.entity.ClassroomEntity;

public class ClassroomDto {
    private Long id;
    private String name;
    private String description;
    private String enrollmentCode;
    private UserDto teacher;
    private int studentCount;

    // Constructors, getters, and setters
    public ClassroomDto(ClassroomEntity classroom) {
        this.id = classroom.getId();
        this.name = classroom.getName();
        this.description = classroom.getDescription();
        this.enrollmentCode = classroom.getEnrollmentCode();
        this.teacher = new UserDto(classroom.getTeacher());
        this.studentCount = classroom.getStudents().size();
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

    public UserDto getTeacher() {
        return teacher;
    }

    public void setTeacher(UserDto teacher) {
        this.teacher = teacher;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }
}