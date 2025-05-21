package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.ClassroomRepository;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.service.AIService;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContentService {

    private static final Logger logger = LoggerFactory.getLogger(ContentService.class);
    private final AIService aiService;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    
    @Autowired
    public ContentService(ContentRepository contentRepository,
                          UserRepository userRepository,
                          ClassroomRepository classroomRepository,
                          AIService aiService) {
        this.contentRepository = contentRepository;
        this.userRepository = userRepository;
        this.classroomRepository = classroomRepository;
        this.aiService = aiService;
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

        if (!(content.getCreator().getId() == (user.getId())) &&
                (content.getClassroom() == null || !(content.getClassroom().getTeacher().getId() == (user.getId())))) {
            throw new AccessDeniedException("You don't have permission to delete this content");
        }

        // Clear references to avoid constraint violations
        if (content.getContentData() != null) {
            // Clear word bank items
            if (content.getContentData().getWordBank() != null) {
                content.getContentData().getWordBank().clear();
            }
            
            // Clear roles
            if (content.getContentData().getRoles() != null) {
                content.getContentData().getRoles().clear();
            }
            
            // Clear powerup cards if they exist
            if (content.getContentData().getPowerupCards() != null) {
                content.getContentData().getPowerupCards().clear();
            }
        }
        
        // Clear game sessions
        if (content.getGameSessions() != null) {
            content.getGameSessions().clear();
        }
        
        // Save the cleared entity before deletion to update relationships
        contentRepository.save(content);
        
        // Now delete
        contentRepository.delete(content);
        
        logger.info("Content with ID: {} deleted successfully", id);
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

    @Transactional
    public ContentDTO generateAIContentForClassroom(String topic, Authentication auth, Long classroomId) {
        // Get classroom and creator
        UserEntity creator = getAuthenticatedUser(auth);
        logger.info("Generating AI content about topic: {} for classroom ID: {}", topic, classroomId);
        
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));
        
        if (!(classroom.getTeacher().getId() == (creator.getId()))) {
            throw new AccessDeniedException("Only classroom teacher can create content for this classroom");
        }

        // Get the student count to determine number of roles needed
        int studentCount = classroom.getStudents().size();
        // Ensure at least 2 roles, then add more based on class size (1 role per 2-3 students)
        int rolesNeeded = Math.max(2, (int)Math.ceil(studentCount / 2.0));
        logger.info("Creating content with {} roles for {} students", rolesNeeded, studentCount);
        
        // Get AI response with dynamic role count
        Map<String, Object> request = new HashMap<>();
        request.put("task", "content_generation");
        request.put("topic", topic);
        request.put("roleCount", rolesNeeded); // Pass roleCount to the AI service
        
        String aiResponse = aiService.callAIModel(request).getResult();
        
        // Parse AI response to extract words and roles
        List<String> generatedWords = new ArrayList<>();
        List<String> generatedRoles = new ArrayList<>();
        boolean parsingWords = false;
        boolean parsingRoles = false;
        
        // Log the response for debugging
        logger.info("Parsing AI response: {}", aiResponse);

        // Parse the AI response
        List<WordData> parsedWords = new ArrayList<>(); // Create a temporary structure to hold the parsed words

        for (String line : aiResponse.split("\n")) {
            line = line.trim();
            
            // Check for section headers
            if (line.contains("WORDS:")) {
                parsingWords = true;
                parsingRoles = false;
                logger.debug("Started parsing WORDS section");
                continue;
            } else if (line.contains("ROLES:")) {
                parsingWords = false;
                parsingRoles = true;
                logger.debug("Started parsing ROLES section");
                continue;
            }
            
            // Extract words with descriptions and examples
            if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                String item = line.substring(2).trim();
                if (parsingWords && !item.isEmpty()) {
                    String[] parts = item.split("\\|");
                    String word = parts[0].trim();
                    String description = parts.length > 1 ? parts[1].trim() : "No description available";
                    String example = parts.length > 2 ? parts[2].trim() : "No example available";
                    
                    logger.debug("Found word: {} with description and example", word);
                    // Store the word data for later use
                    generatedWords.add(word);
                    parsedWords.add(new WordData(word, description, example));
                } else if (parsingRoles && !item.isEmpty()) {
                    generatedRoles.add(item);
                    logger.debug("Added role: {}", item);
                }
            }
        }

        // Create new content with classroom association
        ContentEntity content = new ContentEntity();
        content.setTitle("AI Generated: " + topic);
        content.setDescription("AI-generated content about " + topic);
        content.setBackgroundTheme("default");
        content.setCreator(creator);
        content.setClassroom(classroom);
        content.setPublished(false);
        
        // Create and set ContentData
        ContentData contentData = new ContentData();
        content.setContentData(contentData);
        contentData.setContent(content);

        // Create and set GameConfig
        GameConfig gameConfig = new GameConfig();
        gameConfig.setStudentsPerGroup(4);
        gameConfig.setTimePerTurn(60);
        gameConfig.setTurnCycles(3);
        content.setGameConfig(gameConfig);
        gameConfig.setContent(content);

        // Now add all the parsed words with their descriptions and examples
        for (WordData wordData : parsedWords) {
            contentData.addWord(wordData.word, wordData.description, wordData.example);
        }
        
        // ADD THIS MISSING CODE: Add the roles to the content
        for (String role : generatedRoles) {
            contentData.addRole(role);
        }

        ContentEntity savedContent = contentRepository.save(content);
        logger.info("Created AI-generated content with ID: {} for classroom: {}", savedContent.getId(), classroomId);
        return convertToDTO(savedContent);
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

        // Word Bank conversion
        if (contentData.getWordBank() != null) {
            List<WordBankItemDTO> wordBankDTOs = contentData.getWordBank().stream()
                .map(word -> new WordBankItemDTO(
                    word.getId(), 
                    word.getWord(),
                    word.getDescription(),  // Make sure these fields are included
                    word.getExampleUsage()  // Make sure these fields are included
                ))
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

    @Transactional
    public ContentDTO generateAIContent(String topic, Authentication auth) {
        UserEntity creator = getAuthenticatedUser(auth);
        logger.info("Generating AI content about topic: {} for user: {}", topic, creator.getEmail());

        // Prepare request for AI
        Map<String, Object> request = new HashMap<>();
        request.put("task", "content_generation");
        request.put("topic", topic);

        // Get AI response
        String aiResponse = aiService.callAIModel(request).getResult();
        logger.info("Received AI response: {}", aiResponse);

        // Parse AI response to extract words and roles
        List<String> generatedWords = new ArrayList<>();
        List<String> generatedRoles = new ArrayList<>();
        
        // Simple parsing of the expected format
        boolean parsingWords = false;
        boolean parsingRoles = false;
        
        // Log the response for debugging
        logger.info("Parsing AI response: {}", aiResponse);

        for (String line : aiResponse.split("\n")) {
            line = line.trim();
            
            // Check for section headers
            if (line.contains("WORDS:")) {
                parsingWords = true;
                parsingRoles = false;
                logger.debug("Started parsing WORDS section");
                continue;
            } else if (line.contains("ROLES:")) {
                parsingWords = false;
                parsingRoles = true;
                logger.debug("Started parsing ROLES section");
                continue;
            }
            
            // Check for item with various prefixes
            if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                String item = line.substring(2).trim();
                if (parsingWords && !item.isEmpty()) {
                    generatedWords.add(item);
                    logger.debug("Added word: {}", item);
                } else if (parsingRoles && !item.isEmpty()) {
                    generatedRoles.add(item);
                    logger.debug("Added role: {}", item);
                }
            }
        }

        // Add fallback if parsing failed to find any words or roles
        if (generatedWords.isEmpty()) {
            logger.warn("No words found in AI response, adding fallback words");
            generatedWords.add("vocabulary");
            generatedWords.add("language");
            generatedWords.add("speaking");
            generatedWords.add("listening");
            generatedWords.add("conversation");
        }

        if (generatedRoles.isEmpty()) {
            logger.warn("No roles found in AI response, adding fallback roles");
            generatedRoles.add("Speaker");
            generatedRoles.add("Listener");
            generatedRoles.add("Moderator");
            generatedRoles.add("Observer");
        }

        // Create new content
        ContentEntity content = new ContentEntity();
        content.setTitle("AI Generated: " + topic);
        content.setDescription("AI-generated content about " + topic);
        content.setBackgroundTheme("default");
        content.setCreator(creator);
        content.setPublished(false);

        // Create and set ContentData
        ContentData contentData = new ContentData();
        content.setContentData(contentData);
        contentData.setContent(content);

        // Create and set GameConfig
        GameConfig gameConfig = new GameConfig();
        gameConfig.setStudentsPerGroup(4);
        gameConfig.setTimePerTurn(60);
        gameConfig.setTurnCycles(3);
        content.setGameConfig(gameConfig);
        gameConfig.setContent(content);

        // Add generated words
        for (String word : generatedWords) {
            contentData.addWord(word);
        }

        // Add generated roles
        for (String role : generatedRoles) {
            contentData.addRole(role);
        }
        
        ContentEntity savedContent = contentRepository.save(content);
        logger.info("Created AI-generated content with ID: {}", savedContent.getId());
        return convertToDTO(savedContent);
    }

    private static class WordData {
        final String word;
        final String description;
        final String example;
        
        WordData(String word, String description, String example) {
            this.word = word;
            this.description = description;
            this.example = example;
        }
    }
}