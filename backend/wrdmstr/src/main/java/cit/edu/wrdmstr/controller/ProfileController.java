package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
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
}