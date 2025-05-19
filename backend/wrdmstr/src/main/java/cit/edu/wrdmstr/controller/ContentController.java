package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.ContentDTO;
import cit.edu.wrdmstr.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ContentController {

    private static final Logger logger = LoggerFactory.getLogger(ContentController.class);

    private final ContentService contentService;

    @Autowired
    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getAllContent(Authentication auth) {
        logger.info("Fetching all content for authenticated user");
        List<ContentDTO> contentList = contentService.getAllContent(auth);
        logger.info("Found {} content items", contentList.size());
        return ResponseEntity.ok(contentList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> getContentById(@PathVariable Long id, Authentication auth) {
        logger.info("Fetching content with ID: {}", id);
        ContentDTO content = contentService.getContentById(id, auth);
        logger.info("Found content with ID: {}", id);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/creator")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getContentByCreator(Authentication auth) {
        logger.info("Fetching content created by authenticated user");
        List<ContentDTO> contentList = contentService.getContentByCreator(auth);
        logger.info("Found {} content items created by user", contentList.size());
        return ResponseEntity.ok(contentList);
    }

    @GetMapping("/published")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getPublishedContent(Authentication auth) {
        logger.info("Fetching published content for authenticated user");
        List<ContentDTO> contentList = contentService.getPublishedContent(auth);
        logger.info("Found {} published content items", contentList.size());
        return ResponseEntity.ok(contentList);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContent(
            @RequestBody ContentDTO contentDTO,
            Authentication auth) {
        logger.info("Creating new content with title: {}", contentDTO.getTitle());
        ContentDTO createdContent = contentService.createContent(contentDTO, auth);
        logger.info("Created content with ID: {}", createdContent.getId());
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> updateContent(
            @PathVariable Long id,
            @RequestBody ContentDTO contentDTO,
            Authentication auth) {
        logger.info("Updating content with ID: {}", id);
        ContentDTO updatedContent = contentService.updateContent(id, contentDTO, auth);
        logger.info("Updated content with ID: {}", id);
        return ResponseEntity.ok(updatedContent);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id, Authentication auth) {
        logger.info("Deleting content with ID: {}", id);
        contentService.deleteContent(id, auth);
        logger.info("Deleted content with ID: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> publishContent(@PathVariable Long id, Authentication auth) {
        logger.info("Publishing content with ID: {}", id);
        ContentDTO publishedContent = contentService.publishContent(id, auth);
        logger.info("Published content with ID: {}", id);
        return ResponseEntity.ok(publishedContent);
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> unpublishContent(@PathVariable Long id, Authentication auth) {
        logger.info("Unpublishing content with ID: {}", id);
        ContentDTO unpublishedContent = contentService.unpublishContent(id, auth);
        logger.info("Unpublished content with ID: {}", id);
        return ResponseEntity.ok(unpublishedContent);
    }

    @GetMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAnyAuthority('USER_TEACHER', 'USER_STUDENT')")
    public ResponseEntity<List<ContentDTO>> getContentByClassroom(@PathVariable Long classroomId) {
        logger.info("Getting content for classroom ID: {}", classroomId);
        List<ContentDTO> content = contentService.getContentByClassroom(classroomId);
        logger.info("Found {} content items for classroom ID: {}", content.size(), classroomId);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/classroom/{classroomId}/published")
    @PreAuthorize("hasAnyAuthority('USER_TEACHER', 'USER_STUDENT')")
    public ResponseEntity<List<ContentDTO>> getPublishedContentByClassroom(
            @PathVariable Long classroomId,
            Authentication auth) {
        logger.info("Getting published content for classroom ID: {}", classroomId);
        List<ContentDTO> content = contentService.getPublishedContentByClassroom(classroomId, auth);
        logger.info("Found {} published content items for classroom ID: {}", content.size(), classroomId);
        return ResponseEntity.ok(content);
    }

    @PostMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContentForClassroom(
            @RequestBody ContentDTO contentDTO,
            Authentication auth,
            @PathVariable Long classroomId) {
        logger.info("Creating content for classroom ID: {}", classroomId);
        ContentDTO createdContent = contentService.createContentForClassroom(contentDTO, auth, classroomId);
        logger.info("Created content with ID: {} for classroom ID: {}", createdContent.getId(), classroomId);
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> generateContent(@RequestBody Map<String, String> request, 
                                                    Authentication auth) {
        String topic = request.get("topic");
        if (topic == null || topic.trim().isEmpty()) {
            logger.error("Topic is required for AI content generation");
            return ResponseEntity.badRequest().build();
        }
        
        logger.info("Generating AI content for topic: {}", topic);
        ContentDTO generatedContent = contentService.generateAIContent(topic, auth);
        logger.info("Generated AI content with ID: {}", generatedContent.getId());
        return new ResponseEntity<>(generatedContent, HttpStatus.CREATED);
        }
}