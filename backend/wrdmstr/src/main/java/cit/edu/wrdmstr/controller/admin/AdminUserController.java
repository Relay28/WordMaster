package cit.edu.wrdmstr.controller.admin;

import cit.edu.wrdmstr.dto.*;
import cit.edu.wrdmstr.service.AdminUserService;
import cit.edu.wrdmstr.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AuthService authService;

    @Autowired
    public AdminUserController(AdminUserService adminUserService, AuthService authService) {
        this.adminUserService = adminUserService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(Authentication authentication) {
        return ResponseEntity.ok(adminUserService.getAllUsers(authentication));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserById(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(adminUserService.getUserById(authentication, userId));
    }

    @PostMapping("/C")
    public ResponseEntity<UserDto> createUser(
            @RequestBody @Valid UserCreateDto userCreateDto,
            Authentication authentication) {
        System.out.println("AAAAAAAGGGGGGGHHHHHHHHHHH FIRST");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createUser(authentication, userCreateDto));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long userId,
            @RequestBody @Valid UserUpdateDto updateDto,
            Authentication authentication) {
        return ResponseEntity.ok(adminUserService.updateUser(authentication, userId, updateDto));
    }

    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<Void> deactivateUser(
            @PathVariable Long userId,
            Authentication authentication) {
        adminUserService.deactivateUser(authentication, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/activate")
    public ResponseEntity<Void> activateUser(
            @PathVariable Long userId,
            Authentication authentication) {
        adminUserService.activateUser(authentication, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long userId,
            Authentication authentication) {
        adminUserService.deleteUser(authentication, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> adminLogin(@RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);

        // Verify the user is actually an admin
        if (!"ADMIN".equals(response.getRole())) {
            throw new AccessDeniedException("Only admin users can login here");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-first")
    public ResponseEntity<AuthResponse> createFirstAdmin(@RequestBody AdminCreateDto adminCreateDto) {
        // Create the admin account
        UserDto adminDto = adminUserService.createFirstAdmin(adminCreateDto);

        // Automatically login the admin
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setEmail(adminCreateDto.getEmail());
        loginRequest.setPassword(adminCreateDto.getPassword());

        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}