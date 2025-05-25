package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.ComprehensionResultDTO;
import cit.edu.wrdmstr.service.ComprehensionCheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comprehension")
public class ComprehensionController {

    @Autowired
    private ComprehensionCheckService comprehensionCheckService;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<ComprehensionResultDTO>> getResultsBySession(
            @PathVariable Long sessionId,
            Authentication auth) {
        List<ComprehensionResultDTO> results = comprehensionCheckService.getResultsBySession(sessionId, auth);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ComprehensionResultDTO>> getResultsByStudent(
            @PathVariable Long studentId,
            Authentication auth) {
        List<ComprehensionResultDTO> results = comprehensionCheckService.getResultsByStudent(studentId, auth);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/session/{sessionId}/student/{studentId}")
    public ResponseEntity<ComprehensionResultDTO> getResult(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            Authentication auth) {
        ComprehensionResultDTO result = comprehensionCheckService.getResult(sessionId, studentId, auth);
        return ResponseEntity.ok(result);
    }
}