package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
import cit.edu.wrdmstr.dto.UserSetupDto;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/profile")
@PreAuthorize("isAuthenticated()")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final ProfileService profileService;

    @Autowired
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<UserEntity> getProfile(Authentication authentication) {
        UserEntity user = profileService.getAuthenticatedUserProfile(authentication);
        return ResponseEntity.ok(user);
    }

    @PutMapping
    public ResponseEntity<UserEntity> updateProfile(
            @Valid @RequestBody UserProfileUpdateDto updateDto,
            Authentication authentication) {
        UserEntity updatedUser = profileService.updateAuthenticatedUserProfile(authentication, updateDto);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping
    public String deactivateProfile(Authentication authentication) {
       return  profileService.deactivateAuthenticatedUser(authentication);
    }

    @GetMapping("/setup/status")
    public ResponseEntity<Boolean> checkSetupStatus(Authentication authentication) {
        boolean setupNeeded = profileService.isSetupNeeded(authentication);
        return ResponseEntity.ok(setupNeeded);
    }

    @PostMapping("/setup")
    public ResponseEntity<UserEntity> completeSetup(
            Authentication authentication,
            @RequestBody UserSetupDto setupDto) {
        UserEntity updatedUser = profileService.setupUserProfile(authentication, setupDto);
        return ResponseEntity.ok(updatedUser);
    }
}