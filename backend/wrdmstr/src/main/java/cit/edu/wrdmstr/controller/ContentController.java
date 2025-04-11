package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.ContentDTO;
import cit.edu.wrdmstr.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

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
    public ResponseEntity<List<ContentDTO>> getAllContent() {
        return ResponseEntity.ok(contentService.getAllContent());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> getContentById(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.getContentById(id));
    }

    @GetMapping("/creator/{creatorId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getContentByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(contentService.getContentByCreator(creatorId));
    }

    @GetMapping("/published")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getPublishedContent() {
        return ResponseEntity.ok(contentService.getPublishedContent());
    }                       

    @PostMapping("/creator/{creatorId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContent(
            @RequestBody ContentDTO contentDTO,
            @PathVariable Long creatorId) {
        ContentDTO createdContent = contentService.createContent(contentDTO, creatorId);
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> updateContent(
            @PathVariable Long id,
            @RequestBody ContentDTO contentDTO) {
        return ResponseEntity.ok(contentService.updateContent(id, contentDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id) {
        contentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> publishContent(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.publishContent(id));
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> unpublishContent(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.unpublishContent(id));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<ContentDTO>> getContentByClassroom(@PathVariable Long classroomId) {
        logger.info("Getting content for classroom ID: {}", classroomId);
        List<ContentDTO> content = contentService.getContentByClassroom(classroomId);
        logger.info("Found {} content items for classroom ID: {}", content.size(), classroomId);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/classroom/{classroomId}/published")
    public ResponseEntity<List<ContentDTO>> getPublishedContentByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(contentService.getPublishedContentByClassroom(classroomId));
    }

    @PostMapping("/classroom/{classroomId}/creator/{creatorId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContentForClassroom(
            @RequestBody ContentDTO contentDTO,
            @PathVariable Long creatorId,
            @PathVariable Long classroomId) {
        logger.info("Creating content for classroom ID: {} by creator ID: {}", classroomId, creatorId);
        ContentDTO createdContent = contentService.createContentForClassroom(contentDTO, creatorId, classroomId);
        logger.info("Created content with ID: {} for classroom ID: {}", createdContent.getId(), classroomId);
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }
}
