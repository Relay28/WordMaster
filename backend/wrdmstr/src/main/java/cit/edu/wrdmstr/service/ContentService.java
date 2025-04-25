package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.ClassroomRepository;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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

    private UserEntity getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public List<ContentDTO> getAllContent(Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        return contentRepository.findByCreator(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ContentDTO getContentById(Long id, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        if (!(content.getCreator().getId()==(user.getId())) &&
                (content.getClassroom() == null || !(content.getClassroom().getTeacher().getId() ==(user.getId())))) {
            throw new AccessDeniedException("You don't have permission to access this content");
        }

        return convertToDTO(content);
    }

    public List<ContentDTO> getContentByCreator(Authentication auth) {
        UserEntity creator = getAuthenticatedUser(auth);
        return contentRepository.findByCreator(creator).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ContentDTO> getPublishedContent(Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        return contentRepository.findByCreatorAndPublished(user, true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContentDTO createContent(ContentDTO contentDTO, Authentication auth) {
        UserEntity creator = getAuthenticatedUser(auth);

        ContentEntity content = new ContentEntity();
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setCreator(creator);
        content.setPublished(contentDTO.isPublished());

        // Create and set ContentData
        ContentData contentData = new ContentData();
        contentData.setBackgroundImage(contentDTO.getContentData().getBackgroundImage());
        content.setContentData(contentData);
        contentData.setContent(content);

        // Create and set GameConfig
        GameConfig gameConfig = new GameConfig();
        GameConfigDTO gameConfigDTO = contentDTO.getGameConfig();
        gameConfig.setStudentsPerGroup(gameConfigDTO.getStudentsPerGroup());
        gameConfig.setTimePerTurn(gameConfigDTO.getTimePerTurn());
        gameConfig.setTurnCycles(gameConfigDTO.getTurnCycles());
        content.setGameConfig(gameConfig);
        gameConfig.setContent(content);

        // Add word bank items
        if (contentDTO.getContentData().getWordBank() != null) {
            for (WordBankItemDTO wordDTO : contentDTO.getContentData().getWordBank()) {
                contentData.addWord(wordDTO.getWord());
            }
        }

        // Add roles
        if (contentDTO.getContentData().getRoles() != null) {
            for (RoleDTO roleDTO : contentDTO.getContentData().getRoles()) {
                contentData.addRole(roleDTO.getName());
            }
        }

        ContentEntity savedContent = contentRepository.save(content);
        return convertToDTO(savedContent);
    }

    @Transactional
    public ContentDTO updateContent(Long id, ContentDTO contentDTO, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        if (!(content.getCreator().getId() ==(user.getId()))) {
            throw new AccessDeniedException("You don't have permission to update this content");
        }

        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setPublished(contentDTO.isPublished());

        // Update ContentData
        ContentData contentData = content.getContentData();
        contentData.setBackgroundImage(contentDTO.getContentData().getBackgroundImage());

        // Update word bank
        contentData.getWordBank().clear();
        if (contentDTO.getContentData().getWordBank() != null) {
            for (WordBankItemDTO wordDTO : contentDTO.getContentData().getWordBank()) {
                contentData.addWord(wordDTO.getWord());
            }
        }

        // Update roles
        contentData.getRoles().clear();
        if (contentDTO.getContentData().getRoles() != null) {
            for (RoleDTO roleDTO : contentDTO.getContentData().getRoles()) {
                contentData.addRole(roleDTO.getName());
            }
        }

        // Update GameConfig
        GameConfig gameConfig = content.getGameConfig();
        GameConfigDTO gameConfigDTO = contentDTO.getGameConfig();
        gameConfig.setStudentsPerGroup(gameConfigDTO.getStudentsPerGroup());
        gameConfig.setTimePerTurn(gameConfigDTO.getTimePerTurn());
        gameConfig.setTurnCycles(gameConfigDTO.getTurnCycles());

        ContentEntity updatedContent = contentRepository.save(content);
        return convertToDTO(updatedContent);
    }

    @Transactional
    public void deleteContent(Long id, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        if (!(content.getCreator().getId() ==(user.getId())) &&
                (content.getClassroom() == null || !(content.getClassroom().getTeacher().getId() ==(user.getId())))) {
            throw new AccessDeniedException("You don't have permission to delete this content");
        }

        contentRepository.deleteById(id);
    }

    @Transactional
    public ContentDTO publishContent(Long id, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        if (!(content.getCreator().getId() ==(user.getId()))) {
            throw new AccessDeniedException("You don't have permission to publish this content");
        }

        content.setPublished(true);
        return convertToDTO(contentRepository.save(content));
    }

    @Transactional
    public ContentDTO unpublishContent(Long id, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        if (!(content.getCreator().getId() ==(user.getId()))) {
            throw new AccessDeniedException("You don't have permission to unpublish this content");
        }

        content.setPublished(false);
        return convertToDTO(contentRepository.save(content));
    }

    @Transactional
    public ContentDTO createContentForClassroom(ContentDTO contentDTO, Authentication auth, Long classroomId) {
        UserEntity creator = getAuthenticatedUser(auth);
        logger.info("Creating content for classroom ID: {} by creator: {}", classroomId, creator.getEmail());

        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        if (!(classroom.getTeacher().getId() ==(creator.getId()))) {
            logger.error("Creator ID: {} is not the teacher of classroom ID: {}", creator.getId(), classroomId);
            throw new AccessDeniedException("Only classroom teacher can create content for this classroom");
        }

        ContentEntity content = new ContentEntity();
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setCreator(creator);
        content.setClassroom(classroom);
        content.setPublished(contentDTO.isPublished());

        // Create and set ContentData
        ContentData contentData = new ContentData();
        contentData.setBackgroundImage(contentDTO.getContentData().getBackgroundImage());
        content.setContentData(contentData);
        contentData.setContent(content);

        // Create and set GameConfig
        GameConfig gameConfig = new GameConfig();
        GameConfigDTO gameConfigDTO = contentDTO.getGameConfig();
        gameConfig.setStudentsPerGroup(gameConfigDTO.getStudentsPerGroup());
        gameConfig.setTimePerTurn(gameConfigDTO.getTimePerTurn());
        gameConfig.setTurnCycles(gameConfigDTO.getTurnCycles());
        content.setGameConfig(gameConfig);
        gameConfig.setContent(content);

        // Add word bank items
        if (contentDTO.getContentData().getWordBank() != null) {
            for (WordBankItemDTO wordDTO : contentDTO.getContentData().getWordBank()) {
                contentData.addWord(wordDTO.getWord());
            }
        }

        // Add roles
        if (contentDTO.getContentData().getRoles() != null) {
            for (RoleDTO roleDTO : contentDTO.getContentData().getRoles()) {
                contentData.addRole(roleDTO.getName());
            }
        }

        ContentEntity savedContent = contentRepository.save(content);
        return convertToDTO(savedContent);
    }

    public List<ContentDTO> getContentByClassroom(Long classroomId) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        return contentRepository.findByClassroom(classroom).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ContentDTO> getPublishedContentByClassroom(Long classroomId, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        boolean isTeacher = classroom.getTeacher().getId()==(user.getId());
        boolean isEnrolledStudent = classroom.getStudents().contains(user);

        if (!isTeacher && !isEnrolledStudent) {
            throw new AccessDeniedException("You don't have permission to access content in this classroom");
        }

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
        dto.setPublished(content.isPublished());
        dto.setCreatedAt(content.getCreatedAt());
        dto.setUpdatedAt(content.getUpdatedAt());
        dto.setCreatorId(content.getCreator().getId());
        dto.setCreatorName(content.getCreator().getFname() + " " + content.getCreator().getLname());

        if (content.getClassroom() != null) {
            dto.setClassroomId(content.getClassroom().getId());
            dto.setClassroomName(content.getClassroom().getName());
        }

        // Convert ContentData
        ContentData contentData = content.getContentData();
        if (contentData != null) {
            ContentDataDTO contentDataDTO = new ContentDataDTO();
            contentDataDTO.setBackgroundImage(contentData.getBackgroundImage());

            // Convert word bank
            if (contentData.getWordBank() != null) {
                List<WordBankItemDTO> wordBankDTOs = contentData.getWordBank().stream()
                        .map(item -> new WordBankItemDTO(item.getId(), item.getWord()))
                        .collect(Collectors.toList());
                contentDataDTO.setWordBank(wordBankDTOs);
            }

            // Convert roles
            if (contentData.getRoles() != null) {
                List<RoleDTO> roleDTOs = contentData.getRoles().stream()
                        .map(role -> new RoleDTO(role.getId(), role.getName()))
                        .collect(Collectors.toList());
                contentDataDTO.setRoles(roleDTOs);
            }
            dto.setContentData(contentDataDTO);
        }

        // Convert GameConfig
        GameConfig gameConfig = content.getGameConfig();
        if (gameConfig != null) {
            GameConfigDTO gameConfigDTO = new GameConfigDTO();
            gameConfigDTO.setStudentsPerGroup(gameConfig.getStudentsPerGroup());
            gameConfigDTO.setTimePerTurn(gameConfig.getTimePerTurn());
            gameConfigDTO.setTurnCycles(gameConfig.getTurnCycles());
            dto.setGameConfig(gameConfigDTO);
        }

        return dto;
    }
}