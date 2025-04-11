package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.ContentDTO;
import cit.edu.wrdmstr.entity.ClassroomEntity;
import cit.edu.wrdmstr.entity.ContentEntity;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.ClassroomRepository;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContentService {

    private static final Logger logger = LoggerFactory.getLogger(ContentService.class);

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;

    @Autowired
    public ContentService(ContentRepository contentRepository, 
                         UserRepository userRepository,
                         ClassroomRepository classroomRepository) {
        this.contentRepository = contentRepository;
        this.userRepository = userRepository;
        this.classroomRepository = classroomRepository;
    }

    public List<ContentDTO> getAllContent() {
        return contentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ContentDTO getContentById(Long id) {
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));
        return convertToDTO(content);
    }

    public List<ContentDTO> getContentByCreator(Long creatorId) {
        UserEntity creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + creatorId));
        return contentRepository.findByCreator(creator).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ContentDTO> getPublishedContent() {
        return contentRepository.findByPublished(true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContentDTO createContent(ContentDTO contentDTO, Long creatorId) {
        UserEntity creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + creatorId));
        
        ContentEntity content = new ContentEntity();
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setContentData(contentDTO.getContentData());
        content.setGameElementConfig(contentDTO.getGameElementConfig());
        content.setCreator(creator);
        content.setPublished(contentDTO.isPublished());
        
        ContentEntity savedContent = contentRepository.save(content);
        return convertToDTO(savedContent);
    }

    @Transactional
    public ContentDTO updateContent(Long id, ContentDTO contentDTO) {
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));
        
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setContentData(contentDTO.getContentData());
        content.setGameElementConfig(contentDTO.getGameElementConfig());
        content.setPublished(contentDTO.isPublished());
        
        ContentEntity updatedContent = contentRepository.save(content);
        return convertToDTO(updatedContent);
    }

    @Transactional
    public void deleteContent(Long id) {
        if (!contentRepository.existsById(id)) {
            throw new EntityNotFoundException("Content not found with id: " + id);
        }
        contentRepository.deleteById(id);
    }

    @Transactional
    public ContentDTO publishContent(Long id) {
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));
        content.setPublished(true);
        return convertToDTO(contentRepository.save(content));
    }

    @Transactional
    public ContentDTO unpublishContent(Long id) {
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));
        content.setPublished(false);
        return convertToDTO(contentRepository.save(content));
    }

    @Transactional
    public ContentDTO createContentForClassroom(ContentDTO contentDTO, Long creatorId, Long classroomId) {
        logger.info("Creating content for classroom ID: {} by creator ID: {}", classroomId, creatorId);
        
        UserEntity creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + creatorId));
        
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));
        
        logger.info("Found classroom: {}", classroom.getName());
        logger.info("Found creator: {} {}", creator.getFname(), creator.getLname());
        
        if (classroom.getTeacher().getId() != creator.getId()) {
            logger.error("Creator ID: {} is not the teacher of classroom ID: {}", creatorId, classroomId);
            throw new RuntimeException("Only classroom teacher can create content for this classroom");
        }
        
        ContentEntity content = new ContentEntity();
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setContentData(contentDTO.getContentData());
        content.setGameElementConfig(contentDTO.getGameElementConfig());
        content.setCreator(creator);
        content.setClassroom(classroom);
        content.setPublished(contentDTO.isPublished());
        
        logger.info("Saving content with title: {} for classroom: {}", content.getTitle(), classroom.getName());
        ContentEntity savedContent = contentRepository.save(content);
        logger.info("Content saved with ID: {}", savedContent.getId());
        
        return convertToDTO(savedContent);
    }

    public List<ContentDTO> getContentByClassroom(Long classroomId) {
        logger.info("Service: Getting content for classroom ID: {}", classroomId);
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));
        
        List<ContentEntity> contentList = contentRepository.findByClassroom(classroom);
        logger.info("Service: Found {} content items for classroom ID: {}", contentList.size(), classroomId);
        
        List<ContentDTO> result = contentList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return result;
    }

    public List<ContentDTO> getPublishedContentByClassroom(Long classroomId) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));
        
        return contentRepository.findByClassroomAndPublished(classroom, true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ContentDTO convertToDTO(ContentEntity content) {
        ContentDTO dto = new ContentDTO();
        dto.setId(content.getId());
        dto.setTitle(content.getTitle());
        dto.setDescription(content.getDescription());
        dto.setBackgroundTheme(content.getBackgroundTheme());
        dto.setContentData(content.getContentData());
        dto.setGameElementConfig(content.getGameElementConfig());
        dto.setCreatorId(content.getCreator().getId());
        dto.setCreatorName(content.getCreator().getFname() + " " + content.getCreator().getLname());
        
        if (content.getClassroom() != null) {
            dto.setClassroomId(content.getClassroom().getId());
            dto.setClassroomName(content.getClassroom().getName());
        }
        
        dto.setPublished(content.isPublished());
        dto.setCreatedAt(content.getCreatedAt());
        dto.setUpdatedAt(content.getUpdatedAt());
        return dto;
    }
}
