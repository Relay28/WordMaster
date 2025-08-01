package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.entity.*;
import cit.edu.wrdmstr.repository.ChatMessageEntityRepository;
import cit.edu.wrdmstr.repository.ClassroomRepository;
import cit.edu.wrdmstr.repository.ContentRepository;
import cit.edu.wrdmstr.repository.GameSessionEntityRepository;
import cit.edu.wrdmstr.repository.PlayerSessionEntityRepository;
import cit.edu.wrdmstr.repository.RoleRepository;
import cit.edu.wrdmstr.repository.ScoreRecordEntityRepository;
import cit.edu.wrdmstr.service.AIService;
import cit.edu.wrdmstr.repository.UserRepository;
import cit.edu.wrdmstr.repository.WordBankItemRepository;
import cit.edu.wrdmstr.repository.GrammarResultRepository;
import cit.edu.wrdmstr.repository.VocabularyResultRepository;
import cit.edu.wrdmstr.repository.ComprehensionResultRepository;
import cit.edu.wrdmstr.repository.TeacherFeedbackRepository;
import cit.edu.wrdmstr.repository.PlayerCardRepository;
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
    private final GameSessionEntityRepository gameSessionRepository;
    private final PlayerSessionEntityRepository playerSessionRepository;
    private final ChatMessageEntityRepository chatMessageRepository;
    private final ScoreRecordEntityRepository scoreRecordRepository;
    private final WordBankItemRepository wordBankItemRepository;
    private final RoleRepository roleRepository;
    private final ContentRepository contentDataRepository;
    @Autowired
    private GrammarResultRepository grammarResultRepository;
    @Autowired
    private VocabularyResultRepository vocabularyResultRepository;
    @Autowired
    private ComprehensionResultRepository comprehensionResultRepository;
    @Autowired
    private TeacherFeedbackRepository teacherFeedbackRepository;
    @Autowired
    private PlayerCardRepository playerCardRepository;
    
    @Autowired
    public ContentService(ContentRepository contentRepository,
                          UserRepository userRepository,
                          ClassroomRepository classroomRepository,
                          AIService aiService, GameSessionEntityRepository gameSessionRepository,
                          PlayerSessionEntityRepository playerSessionRepository,
                          ChatMessageEntityRepository chatMessageRepository, 
                          ScoreRecordEntityRepository scoreRecordRepository,
                          WordBankItemRepository wordBankItemRepository,
                          RoleRepository roleRepository,
                          ContentRepository contentDataRepository) {
        this.gameSessionRepository = gameSessionRepository;
        this.playerSessionRepository = playerSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.scoreRecordRepository = scoreRecordRepository;
        this.wordBankItemRepository = wordBankItemRepository;
        this.roleRepository = roleRepository;
        this.contentDataRepository = contentDataRepository;
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
                contentData.addWord(
                    wordDTO.getWord(),
                    wordDTO.getDescription() != null ? wordDTO.getDescription() : "No description available",
                    wordDTO.getExampleUsage() != null ? wordDTO.getExampleUsage() : "No example available"
                );
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

        // Store original group size before updating
        int originalGroupSize = content.getGameConfig().getStudentsPerGroup();
        
        // Update basic content fields
        content.setTitle(contentDTO.getTitle());
        content.setDescription(contentDTO.getDescription());
        content.setBackgroundTheme(contentDTO.getBackgroundTheme());
        content.setPublished(contentDTO.isPublished());

        // Update ContentData
        ContentData contentData = content.getContentData();
        contentData.setBackgroundImage(contentDTO.getContentData().getBackgroundImage());

        // Update word bank while preserving descriptions and examples
        contentData.getWordBank().clear();
        if (contentDTO.getContentData().getWordBank() != null) {
            for (WordBankItemDTO wordDTO : contentDTO.getContentData().getWordBank()) {
                contentData.addWord(
                    wordDTO.getWord(),
                    wordDTO.getDescription() != null ? wordDTO.getDescription() : "No description available",
                    wordDTO.getExampleUsage() != null ? wordDTO.getExampleUsage() : "No example available"
                );
            }
        }

        // Keep existing roles
        List<String> existingRoleNames = new ArrayList<>();
        if (contentData.getRoles() != null) {
            existingRoleNames = contentData.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toList());
        }

        // Update roles with provided roles
        contentData.getRoles().clear();
        if (contentDTO.getContentData().getRoles() != null) {
            for (RoleDTO roleDTO : contentDTO.getContentData().getRoles()) {
                contentData.addRole(roleDTO.getName());
            }
        }

        // Update GameConfig
        GameConfig gameConfig = content.getGameConfig();
        GameConfigDTO gameConfigDTO = contentDTO.getGameConfig();
        int newGroupSize = gameConfigDTO.getStudentsPerGroup();
        gameConfig.setStudentsPerGroup(newGroupSize);
        gameConfig.setTimePerTurn(gameConfigDTO.getTimePerTurn());
        gameConfig.setTurnCycles(gameConfigDTO.getTurnCycles());
        
        // Check if group size increased and generate additional roles if needed
        if (newGroupSize > originalGroupSize) {
            int currentRoleCount = contentData.getRoles().size();
            int rolesNeeded = (int)Math.ceil(newGroupSize * 1.25); // Generate 25% more roles than students
            
            if (currentRoleCount < rolesNeeded) {
                int additionalRolesNeeded = rolesNeeded - currentRoleCount;
                logger.info("Group size changed from {} to {}. Generating {} additional roles", 
                    originalGroupSize, newGroupSize, additionalRolesNeeded);
                
                // Generate additional roles using AI
                List<String> newRoles = generateAdditionalRoles(content.getDescription(), additionalRolesNeeded);
                
                // Add the new roles
                for (String roleName : newRoles) {
                    // Avoid duplicating roles that might already exist
                    if (!contentData.getRoles().stream().anyMatch(r -> r.getName().equalsIgnoreCase(roleName))) {
                        contentData.addRole(roleName);
                    }
                }
            }
        }

        // Always check and clear current player references to avoid foreign key constraint errors
        List<GameSessionEntity> affectedSessions = gameSessionRepository.findByContentId(content.getId());
        for (GameSessionEntity session : affectedSessions) {
            // Clear the current_player reference
            if (session.getCurrentPlayer() != null) {
                session.setCurrentPlayer(null);
                gameSessionRepository.save(session);
            }
            
            // Clean up player cards for all players in this session
            List<Long> playerSessionIds = session.getPlayers().stream()
                    .map(PlayerSessionEntity::getId)
                    .collect(Collectors.toList());
            
            if (!playerSessionIds.isEmpty()) {
                playerCardRepository.deleteByPlayerSessionIds(playerSessionIds);
            }
        }
        
        ContentEntity updatedContent = contentRepository.save(content);
        return convertToDTO(updatedContent);
    }

    @Transactional
    public void deleteContent(Long id, Authentication auth) {
        UserEntity user = getAuthenticatedUser(auth);
        ContentEntity content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content not found with id: " + id));

        // Permission check
        if (!(content.getCreator().getId() == (user.getId())) &&
                (content.getClassroom() == null || !(content.getClassroom().getTeacher().getId() == (user.getId())))) {
            throw new AccessDeniedException("You don't have permission to delete this content");
        }

        logger.info("Starting deletion of content ID: {}", id);

        try {
            // First, clean up all game sessions and their related data
            List<GameSessionEntity> sessions = gameSessionRepository.findByContentId(content.getId());
            for (GameSessionEntity session : sessions) {
                Long sessionId = session.getId();
                
                // Delete assessment results first
                grammarResultRepository.deleteByGameSessionId(sessionId);
                vocabularyResultRepository.deleteByGameSessionId(sessionId);
                comprehensionResultRepository.deleteByGameSessionId(sessionId);
                teacherFeedbackRepository.deleteByGameSessionId(sessionId);
                
                // Get player session IDs BEFORE deleting anything
                List<Long> playerSessionIds = session.getPlayers().stream()
                        .map(PlayerSessionEntity::getId)
                        .collect(Collectors.toList());
                
                // Delete player cards first
                if (!playerSessionIds.isEmpty()) {
                    playerCardRepository.deleteByPlayerSessionIds(playerSessionIds);
                }
                
                // Clear and delete chat messages
                chatMessageRepository.deleteBySessionId(sessionId);
                
                // Clear current player reference BEFORE deleting player sessions
                session.setCurrentPlayer(null);
                gameSessionRepository.save(session);
                
                // Clear the players collection to prevent cascade issues
                session.getPlayers().clear();
                gameSessionRepository.save(session);
                
                // Now delete player sessions using repository method
                playerSessionRepository.deleteBySessionId(sessionId);
                
                // Clear score records - get fresh list after player deletion
                session = gameSessionRepository.findById(sessionId).orElse(null);
                if (session != null) {
                    List<ScoreRecordEntity> scores = new ArrayList<>(session.getScores());
                    session.getScores().clear();
                    gameSessionRepository.save(session);
                    scoreRecordRepository.deleteAll(scores);
                }
                
                // Finally delete the session
                gameSessionRepository.delete(session);
            }
            
            // Now handle the content data cleanup
            ContentData contentData = content.getContentData();
            if (contentData != null) {
                // Clear word bank and roles to prevent cascade issues
                contentData.getWordBank().clear();
                contentData.getRoles().clear();
                
                // Clear the bidirectional relationship
                content.setContentData(null);
                contentData.setContent(null);
                
                // Save the content to break the relationship
                contentRepository.save(content);
            }
            
            // Delete the content itself
            contentRepository.delete(content);
            
            logger.info("Content with ID: {} deleted successfully", id);
        } catch (Exception e) {
            logger.error("Error deleting content with ID: {}", id, e);
            throw e;
        }
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
                contentData.addWord(
                    wordDTO.getWord(),
                    wordDTO.getDescription() != null ? wordDTO.getDescription() : "No description available",
                    wordDTO.getExampleUsage() != null ? wordDTO.getExampleUsage() : "No example available"
                );
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

        
        // Get AI response with dynamic role count
        Map<String, Object> request = new HashMap<>();
        request.put("task", "content_generation");
        request.put("topic", topic);
        
        String aiResponse = aiService.callAIModel(request).getResult();
        
        // Parse AI response to extract words and roles
        List<String> generatedWords = new ArrayList<>();
        List<String> generatedRoles = new ArrayList<>();
        List<WordData> parsedWords = new ArrayList<>();  // Move this declaration outside the loop
        
        boolean parsingDescription = false;
        boolean parsingWords = false;
        boolean parsingRoles = false;
        
        StringBuilder description = new StringBuilder();
        
        // Log the response for debugging
        logger.info("Parsing AI response: {}", aiResponse);

        for (String line : aiResponse.split("\n")) {
            line = line.trim();
            
            // Check for section headers
            if (line.contains("DESCRIPTION:")) {
                parsingDescription = true;
                parsingWords = false;
                parsingRoles = false;
                logger.debug("Started parsing DESCRIPTION section");
                continue;
            } else if (line.contains("WORDS:")) {
                parsingDescription = false;
                parsingWords = true;
                parsingRoles = false;
                logger.debug("Started parsing WORDS section");
                continue;
            } else if (line.contains("ROLES:")) {
                parsingDescription = false;
                parsingWords = false;
                parsingRoles = true;
                logger.debug("Started parsing ROLES section");
                continue;
            }
            
            // Remove this line - we already declared parsedWords outside the loop
            // List<WordData> parsedWords = new ArrayList<>();
            
            // Parse each section accordingly
            if (parsingDescription && !line.isEmpty()) {
                description.append(line).append(" ");
            } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                String item = line.substring(2).trim();
                if (parsingWords && !item.isEmpty()) {
                    String[] parts = item.split("\\|");
                    String word = parts[0].trim();
                    String desc = parts.length > 1 ? parts[1].trim() : "No description available";
                    String example = parts.length > 2 ? parts[2].trim() : "No example available";
                    
                    generatedWords.add(word);
                    parsedWords.add(new WordData(word, desc, example));
                    logger.debug("Found word: {} with description and example", word);
                } else if (parsingRoles && !item.isEmpty()) {
                    generatedRoles.add(item);
                    logger.debug("Started parsing ROLES section");
                }
            }
        }

        // Use the AI-generated description or fall back to default
        String contentDescription = description.length() > 0 ? 
            description.toString().trim() : 
            "AI-generated content about " + topic;
            
        // Create new content
        ContentEntity content = new ContentEntity();
        content.setTitle(topic); // Changed: Use topic directly as title
        content.setDescription(contentDescription);
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
        gameConfig.setStudentsPerGroup(5); // This is your default group size
        gameConfig.setTimePerTurn(60);
        gameConfig.setTurnCycles(3);
        content.setGameConfig(gameConfig);
        gameConfig.setContent(content);

        // Now calculate roles based on group size rather than classroom size
        int studentsPerGroup = gameConfig.getStudentsPerGroup();
        // Ensure we have enough diverse roles for each group
        // Typically you'd want at least 2-3 different roles per group
        int rolesNeeded = Math.max(2, (int)Math.ceil(studentsPerGroup * 0.75)); // About 3/4 of group size as roles

        // Update the AI request with the new rolesNeeded value
        request.put("roleCount", rolesNeeded);

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
        dto.setCreatorProfilePicture(content.getCreator().getProfilePicture());

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
        List<WordData> parsedWords = new ArrayList<>();
        boolean parsingDescription = false;
        boolean parsingWords = false;
        boolean parsingRoles = false;
        
        StringBuilder description = new StringBuilder();
        
        // Log the response for debugging
        logger.info("Parsing AI response: {}", aiResponse);

        for (String line : aiResponse.split("\n")) {
            line = line.trim();
            
            // Check for section headers
            if (line.contains("DESCRIPTION:")) {
                parsingDescription = true;
                parsingWords = false;
                parsingRoles = false;
                logger.debug("Started parsing DESCRIPTION section");
                continue;
            } else if (line.contains("WORDS:")) {
                parsingDescription = false;
                parsingWords = true;
                parsingRoles = false;
                logger.debug("Started parsing WORDS section");
                continue;
            } else if (line.contains("ROLES:")) {
                parsingDescription = false;
                parsingWords = false;
                parsingRoles = true;
                logger.debug("Started parsing ROLES section");
                continue;
            }
            
            // Parse each section accordingly
            if (parsingDescription && !line.isEmpty()) {
                description.append(line).append(" ");
            } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                String item = line.substring(2).trim();
                if (parsingWords && !item.isEmpty()) {
                    String[] parts = item.split("\\|");
                    String word = parts[0].trim();
                    String desc = parts.length > 1 ? parts[1].trim() : "No description available";
                    String example = parts.length > 2 ? parts[2].trim() : "No example available";
                    
                    generatedWords.add(word);
                    parsedWords.add(new WordData(word, desc, example));
                    logger.debug("Found word: {} with description and example", word);
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
        content.setTitle(topic); // Changed: Use topic directly as title
        content.setDescription(description.length() > 0 ? description.toString().trim() : "AI-generated content about " + topic);
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

        // Add words with their descriptions and examples
        for (WordData wordData : parsedWords) {
            contentData.addWord(wordData.word, wordData.description, wordData.example);
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

    /**
     * Helper method to generate additional roles using AI
     */
    private List<String> generateAdditionalRoles(String contentDescription, int count) {
        List<String> generatedRoles = new ArrayList<>();
        
        try {
            // Prepare request for AI
            Map<String, Object> request = new HashMap<>();
            request.put("task", "role_generation");
            request.put("topic", contentDescription);
            request.put("roleCount", count);
            
            // Call AI service
            String aiResponse = aiService.callAIModel(request).getResult();
            logger.info("Received AI response for additional roles: {}", aiResponse);
            
            // Parse the response - expecting one role per line with bullet/dash prefix
            for (String line : aiResponse.split("\n")) {
                line = line.trim();
                if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                    String roleName = line.substring(2).trim();
                    if (!roleName.isEmpty()) {
                        generatedRoles.add(roleName);
                    }
                }
            }
            
            // Add fallback roles if we didn't get enough
            while (generatedRoles.size() < count) {
                generatedRoles.add("Additional Role " + (generatedRoles.size() + 1));
            }
            
        } catch (Exception e) {
            logger.error("Error generating additional roles: {}", e.getMessage());
            // Add fallback roles if the AI call fails
            for (int i = 0; i < count; i++) {
                generatedRoles.add("Additional Role " + (i + 1));
            }
        }
        
        return generatedRoles;
    }
}