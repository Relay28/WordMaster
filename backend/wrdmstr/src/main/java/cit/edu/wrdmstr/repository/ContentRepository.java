package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.ContentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<ContentEntity, Long> {
    List<ContentEntity> findByCreator(UserEntity creator);
    List<ContentEntity> findByCreatorAndPublished(UserEntity creator, boolean published);
    List<ContentEntity> findByPublished(boolean published);
    
    // Add new methods for classroom content
    List<ContentEntity> findByClassroom(ClassroomEntity classroom);
    List<ContentEntity> findByClassroomAndPublished(ClassroomEntity classroom, boolean published);


}
