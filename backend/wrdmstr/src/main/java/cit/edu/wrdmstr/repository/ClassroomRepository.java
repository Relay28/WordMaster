package cit.edu.wrdmstr.repository;


import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.StudentEnrollmentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<ClassroomEntity, Long> {
    Optional<ClassroomEntity> findByEnrollmentCode(String enrollmentCode);
    List<ClassroomEntity> findByTeacher(UserEntity teacher);
    boolean existsByEnrollmentCode(String enrollmentCode);

}