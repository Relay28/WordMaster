package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.ClassroomDto;
import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.StudentEnrollmentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.service.ClassroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
@CrossOrigin("*")
public class ClassroomController {

    private final ClassroomService classroomService;

    @Autowired
    public ClassroomController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    @PostMapping
    public ResponseEntity<ClassroomEntity> createClassroom(
            @RequestBody ClassroomEntity classroom,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.createClassroom(authentication, classroom));
    }

    @PostMapping("/enroll")
    public ResponseEntity<StudentEnrollmentEntity> enrollInClassroom(
            @RequestParam String enrollmentCode,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.enrollStudent(authentication, enrollmentCode));
    }

    // Add this endpoint to the ClassroomController class
    @DeleteMapping("/{classroomId}/members/{studentId}")
    public ResponseEntity<Void> removeStudentFromClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long studentId,
            Authentication authentication) {
        classroomService.removeStudentFromClassroom(authentication, classroomId, studentId);
        return ResponseEntity.noContent().build();
    }




    @GetMapping("/{classroomId}/member-count")
    public ResponseEntity<Integer> getClassroomMemberCount(
            @PathVariable Long classroomId,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.getClassroomMemberCount(authentication, classroomId));
    }

    @PutMapping("/{classroomId}")
    public ResponseEntity<ClassroomEntity> updateClassroom(
            @PathVariable Long classroomId,
            @RequestBody ClassroomEntity updatedClassroom,
            Authentication authentication) {
        return ResponseEntity.ok(
                classroomService.updateClassroom(authentication, classroomId, updatedClassroom));
    }

    @DeleteMapping("/{classroomId}")
    public ResponseEntity<Void> deleteClassroom(
            @PathVariable Long classroomId,
            Authentication authentication) {
        classroomService.deleteClassroom(authentication, classroomId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ClassroomDto>> getUserClassrooms(Authentication authentication) {
        return ResponseEntity.ok(classroomService.getUserClassrooms(authentication));
    }

    // Get classroom details
    @GetMapping("/{classroomId}")
    public ResponseEntity<ClassroomDto> getClassroomDetails(
            @PathVariable Long classroomId,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.getClassroomDetails(authentication, classroomId));
    }

    // Get classroom members
    @GetMapping("/{classroomId}/members")
    public ResponseEntity<List<UserDto>> getClassroomMembers(
            @PathVariable Long classroomId,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.getClassroomMembers(authentication, classroomId));
    }
}