package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.UserProfileDto;
import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
import cit.edu.wrdmstr.dto.UserSetupDto;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.service.ProfileService;
import cit.edu.wrdmstr.service.JwtService;
import cit.edu.wrdmstr.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;
    private final JwtService jwtService;
    private final UserService userService;

    @Autowired
    public ProfileController(ProfileService profileService, JwtService jwtService, UserService userService) {
        this.profileService = profileService;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserProfileDto> getProfile(Authentication authentication) {
        UserProfileDto profileDto = profileService.getAuthenticatedUserProfile(authentication);
        return ResponseEntity.ok(profileDto);
    }

    @PutMapping
    public ResponseEntity<UserEntity> updateProfile(
            @Valid @RequestBody UserProfileUpdateDto updateDto,
            Authentication authentication) {
        UserEntity updatedUser = profileService.updateAuthenticatedUserProfile(authentication, updateDto);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping(value = "/upload-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        Map<String, String> response = new HashMap<>();

        try {
            String profilePictureUrl = profileService.uploadProfilePicture(authentication, file);
            response.put("profilePicture", profilePictureUrl);
            response.put("message", "Profile picture uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            response.put("error", "Failed to process the image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deactivateProfile(Authentication authentication) {
        String result = profileService.deactivateAuthenticatedUser(authentication);
        Map<String, String> response = new HashMap<>();
        response.put("message", result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/setup/status")
    public ResponseEntity<Boolean> checkSetupStatus(Authentication authentication) {
        boolean setupNeeded = profileService.isSetupNeeded(authentication);
        System.out.println("Setup status check for " + authentication.getName() + ": setupNeeded = " + setupNeeded);
        return ResponseEntity.ok(setupNeeded);
    }

    @PostMapping("/setup")
    public ResponseEntity<Map<String, Object>> completeSetup(
            Authentication authentication,
            @RequestBody UserSetupDto setupDto) {
        UserEntity updatedUser = profileService.setupUserProfile(authentication, setupDto);
        
        // Generate a NEW JWT token with the updated role
        String newToken = jwtService.generateToken(userService.loadUserByUsername(updatedUser.getEmail()));
        
        // Return both user data and new token
        Map<String, Object> response = new HashMap<>();
        response.put("id", updatedUser.getId());
        response.put("email", updatedUser.getEmail());
        response.put("fname", updatedUser.getFname());
        response.put("lname", updatedUser.getLname());
        response.put("role", updatedUser.getRole());
        response.put("token", newToken); // New token with updated role!
        
        return ResponseEntity.ok(response);
    }
}