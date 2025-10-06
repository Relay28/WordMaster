package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.entity.PlayerSessionEntity;
import cit.edu.wrdmstr.service.gameplay.GameSessionService;
import cit.edu.wrdmstr.service.gameplay.GroupManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupManagementController {

    @Autowired
    private GroupManagementService groupManagementService;
    
    @Autowired
    private GameSessionService gameSessionService;

    @PostMapping("/sessions/{sessionId}/organize")
    public ResponseEntity<List<Map<String, Object>>> organizeGroups(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        // Verify teacher access
        gameSessionService.verifyTeacherAccess(sessionId, authentication);
        
        // Organize students into groups
        List<Map<String, Object>> groups = groupManagementService.organizeGroups(sessionId);
        return ResponseEntity.ok(groups);
    }
    
    @PutMapping("/players/{playerId}/role/{roleId}")
    public ResponseEntity<PlayerSessionEntity> assignRole(
            @PathVariable Long playerId,
            @PathVariable Long roleId) {
        
        PlayerSessionEntity player = groupManagementService.assignRole(playerId, roleId);
        return ResponseEntity.ok(player);
    }
}