package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.StudentEnrollmentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollmentEntity, Long> {
    boolean existsByClassroomAndStudent(ClassroomEntity classroom, UserEntity student);
    List<StudentEnrollmentEntity> findByStudent(UserEntity student);
    Optional<StudentEnrollmentEntity> findByClassroomAndStudent(ClassroomEntity classroom, UserEntity student);
}