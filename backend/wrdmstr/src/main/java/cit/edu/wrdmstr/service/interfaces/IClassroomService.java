package cit.edu.wrdmstr.service.interfaces;

import cit.edu.wrdmstr.dto.ClassroomDto;
import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.StudentEnrollmentEntity;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface IClassroomService {
    ClassroomEntity createClassroom(Authentication authentication, ClassroomEntity classroom);
    StudentEnrollmentEntity enrollStudent(Authentication authentication, String enrollmentCode);
    void removeStudentFromClassroom(Authentication authentication, Long classroomId, Long studentId);
    List<ClassroomDto> getUserClassrooms(Authentication authentication);
    List<UserDto> getClassroomMembers(Authentication authentication, Long classroomId);
    ClassroomDto getClassroomDetails(Authentication authentication, Long classroomId);
    int getClassroomMemberCount(Authentication authentication, Long classroomId);
    ClassroomEntity updateClassroom(Authentication authentication, Long classroomId, ClassroomEntity updatedClassroom);
    void deleteClassroom(Authentication authentication, Long classroomId);
}