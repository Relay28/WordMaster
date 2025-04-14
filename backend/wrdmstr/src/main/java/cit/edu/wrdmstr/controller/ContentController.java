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
        return ResponseEntity.ok(contentService.getAllContent(auth));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> getContentById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(contentService.getContentById(id,auth));
    }

    @GetMapping("/creator/{creatorId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getContentByCreator( Authentication auth) {
        return ResponseEntity.ok(contentService.getContentByCreator(auth));
    }

    @GetMapping("/published")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<List<ContentDTO>> getPublishedContent( Authentication auth) {
        return ResponseEntity.ok(contentService.getPublishedContent(auth));
    }                       

    @PostMapping("/creator/{creatorId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContent(
            @RequestBody ContentDTO contentDTO,
            Authentication auth) {
        ContentDTO createdContent = contentService.createContent(contentDTO, auth);
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> updateContent(
            @PathVariable Long id,
            @RequestBody ContentDTO contentDTO, Authentication auth) {
        return ResponseEntity.ok(contentService.updateContent(id, contentDTO,auth));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id, Authentication auth) {
        contentService.deleteContent(id,auth);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> publishContent(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(contentService.publishContent(id,auth));
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> unpublishContent(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(contentService.unpublishContent(id,auth));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<ContentDTO>> getContentByClassroom(@PathVariable Long classroomId) {
        logger.info("Getting content for classroom ID: {}", classroomId);
        List<ContentDTO> content = contentService.getContentByClassroom(classroomId);
        logger.info("Found {} content items for classroom ID: {}", content.size(), classroomId);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/classroom/{classroomId}/published")
    public ResponseEntity<List<ContentDTO>> getPublishedContentByClassroom(@PathVariable Long classroomId, Authentication auth) {
        return ResponseEntity.ok(contentService.getPublishedContentByClassroom(classroomId,auth));
    }

    @PostMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAuthority('USER_TEACHER')")
    public ResponseEntity<ContentDTO> createContentForClassroom(
            @RequestBody ContentDTO contentDTO,
            Authentication auth,
            @PathVariable Long classroomId) {
        logger.info("Creating content for classroom ID: {} by creator ID: {}", classroomId);
        ContentDTO createdContent = contentService.createContentForClassroom(contentDTO, auth, classroomId);
        logger.info("Created content with ID: {} for classroom ID: {}", createdContent.getId(), classroomId);
        return new ResponseEntity<>(createdContent, HttpStatus.CREATED);
    }
}
