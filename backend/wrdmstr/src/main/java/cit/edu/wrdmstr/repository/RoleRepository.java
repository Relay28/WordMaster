package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.ContentData;
import cit.edu.wrdmstr.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role,Long> {
    List<Role> findByContentData(ContentData contentData);
    List<Role> findByContentDataContentId(Long contentId);
}
