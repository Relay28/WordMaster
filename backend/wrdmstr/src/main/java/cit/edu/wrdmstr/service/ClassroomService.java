package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.ClassroomDto;
import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.StudentEnrollmentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.ClassroomRepository;
import cit.edu.wrdmstr.repository.StudentEnrollmentRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final StudentEnrollmentRepository enrollmentRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;

    @Autowired
    public ClassroomService(ClassroomRepository classroomRepository,
                            UserRepository userRepository,
                            StudentEnrollmentRepository enrollmentRepository) {
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // Create a new classroom
    public ClassroomEntity createClassroom(Authentication authentication, ClassroomEntity classroom) {
        UserEntity teacher = getAuthenticatedUser(authentication);

        if (!"USER_TEACHER".equals(teacher.getRole())) {
            throw new RuntimeException("Only teachers can create classrooms");
        }

        classroom.setTeacher(teacher);
        classroom.setEnrollmentCode(generateEnrollmentCode());
        return classroomRepository.save(classroom);
    }

    // Enroll student in a classroom
    public StudentEnrollmentEntity enrollStudent(Authentication authentication, String enrollmentCode) {
        UserEntity student = getAuthenticatedUser(authentication);

        if (!"USER_STUDENT".equals(student.getRole())) {
            throw new RuntimeException("Only students can enroll in classrooms");
        }

        ClassroomEntity classroom = classroomRepository.findByEnrollmentCode(enrollmentCode)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        // Check if already enrolled
        if (enrollmentRepository.existsByClassroomAndStudent(classroom, student)) {
            throw new RuntimeException("Student already enrolled in this classroom");
        }

        StudentEnrollmentEntity enrollment = new StudentEnrollmentEntity();
        enrollment.setClassroom(classroom);
        enrollment.setStudent(student);

        return enrollmentRepository.save(enrollment);
    }

    // Get all classrooms for the authenticated teacher
    public List<ClassroomDto> getUserClassrooms(Authentication authentication) {
        UserEntity user = getAuthenticatedUser(authentication);

        if ("USER_TEACHER".equals(user.getRole())) {
            return classroomRepository.findByTeacher(user)
                    .stream()
                    .map(ClassroomDto::new)
                    .collect(Collectors.toList());
        } else {
            return enrollmentRepository.findByStudent(user)
                    .stream()
                    .map(StudentEnrollmentEntity::getClassroom)
                    .map(ClassroomDto::new)
                    .collect(Collectors.toList());
        }
    }

    // Get classroom members
    public List<UserDto> getClassroomMembers(Authentication authentication, Long classroomId) {
        UserEntity requester = getAuthenticatedUser(authentication);
        ClassroomEntity classroom = getClassroomById(classroomId);

        // Check if requester is teacher or enrolled student
        boolean isTeacher = classroom.getTeacher().getId()==(requester.getId());
        boolean isEnrolled = classroom.getStudents().stream()
                .anyMatch(s -> s.getId()==(requester.getId()));

        if (!isTeacher && !isEnrolled) {
            throw new RuntimeException("You must be a member of this classroom to view its members");
        }

        return classroom.getStudents().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }


    public ClassroomDto getClassroomDetails(Authentication authentication, Long classroomId) {
        UserEntity requester = getAuthenticatedUser(authentication);
        ClassroomEntity classroom = getClassroomById(classroomId);

        // Check if requester is teacher or enrolled student
        boolean isTeacher = classroom.getTeacher().getId()==(requester.getId());
        boolean isEnrolled = classroom.getStudents().stream()
                .anyMatch(s -> s.getId()==(requester.getId()));

        if (!isTeacher && !isEnrolled) {
            throw new RuntimeException("You must be a member of this classroom to view its details");
        }

        return new ClassroomDto(classroom);
    }
    // Get classroom member count
    public int getClassroomMemberCount(Authentication authentication, Long classroomId) {
        UserEntity requester = getAuthenticatedUser(authentication);
        ClassroomEntity classroom = getClassroomById(classroomId);

        // Only teacher can view member count
        if (!(classroom.getTeacher().getId() ==(requester.getId()))) {
            throw new RuntimeException("Only the classroom teacher can view member count");
        }

        return classroom.getStudents().size();
    }

    // Update classroom information
    public ClassroomEntity updateClassroom(Authentication authentication, Long classroomId, ClassroomEntity updatedClassroom) {
        UserEntity teacher = getAuthenticatedUser(authentication);
        ClassroomEntity existingClassroom = getClassroomById(classroomId);

        if (!(existingClassroom.getTeacher().getId() ==(teacher.getId()))) {
            throw new RuntimeException("Only the classroom teacher can update the classroom");
        }

        existingClassroom.setName(updatedClassroom.getName());
        existingClassroom.setDescription(updatedClassroom.getDescription());

        return classroomRepository.save(existingClassroom);
    }

    // Delete a classroom
    public void deleteClassroom(Authentication authentication, Long classroomId) {
        UserEntity teacher = getAuthenticatedUser(authentication);
        ClassroomEntity classroom = getClassroomById(classroomId);

        if (!(classroom.getTeacher().getId() ==(teacher.getId()))) {
            throw new RuntimeException("Only the classroom teacher can delete the classroom");
        }

        classroomRepository.delete(classroom);
    }

    // Helper method to get authenticated user
    private UserEntity getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    // Helper method to get classroom by ID
    private ClassroomEntity getClassroomById(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
    }

    // Generate a random enrollment code
    private String generateEnrollmentCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder(CODE_LENGTH);

        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }

        // Ensure code is unique
        while (classroomRepository.existsByEnrollmentCode(code.toString())) {
            code = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
        }

        return code.toString();
    }


}