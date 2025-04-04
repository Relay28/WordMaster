package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
import cit.edu.wrdmstr.dto.UserSetupDto;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserEntity getAuthenticatedUserProfile(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public UserEntity updateAuthenticatedUserProfile(Authentication authentication, UserProfileUpdateDto updateDto) {
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (updateDto.getFname() != null) {
            user.setFname(updateDto.getFname());
        }
        if (updateDto.getLname() != null) {
            user.setLname(updateDto.getLname());
        }
        if (updateDto.getEmail() != null && !updateDto.getEmail().equals(user.getEmail())) {
            // Check if new email is already taken by another user
            if (userRepository.existsByEmail(updateDto.getEmail())) {
                throw new IllegalArgumentException("Email is already in use by another account");
            }
            user.setEmail(updateDto.getEmail());
        }
        if (updateDto.getProfilePicture() != null) {
            user.setProfilePicture(updateDto.getProfilePicture());
        }
        if (updateDto.getNewPassword() != null && !updateDto.getNewPassword().isEmpty()) {
            validatePasswordChange(user, updateDto.getCurrentPassword(), updateDto.getNewPassword());
            user.setPassword(passwordEncoder.encode(updateDto.getNewPassword()));
        }

        return userRepository.save(user);
    }

    public String deactivateAuthenticatedUser(Authentication authentication) {
        // Get email from authentication
        String email = authentication.getName();

        // Find user by email
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Additional security verification
        if (!user.getEmail().equals(email)) {
            throw new SecurityException("Unauthorized profile deactivation attempt");
        }

        // Check if account is already deactivated
        if (!user.isActive()) {
            return "Account is already deactivated";
        }

        // Soft delete the account
        user.setActive(false);
        userRepository.save(user);

        // Return success message
        return "Account deactivated successfully. You can reactivate by logging in within 30 days.";
    }
    private void validatePasswordChange(UserEntity user, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isEmpty()) {
            throw new IllegalArgumentException("Current password is required to change password");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }
    }

    public UserEntity setupUserProfile(Authentication authentication, UserSetupDto setupDto) {
        // Get the authenticated user's email
        String email = authentication.getName();

        // Find the user
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Validate that the user hasn't already completed setup
        // Only consider a profile "set up" if role is already set to a finalized role (not USER)
        if (!user.getRole().equals("USER") && 
            user.getFname() != null && 
            user.getLname() != null) {
            throw new IllegalStateException("User profile has already been set up");
        }

        // Validate the role
        if (!"USER_STUDENT".equalsIgnoreCase(setupDto.getRole()) && !"USER_TEACHER".equalsIgnoreCase(setupDto.getRole())) {
            throw new IllegalArgumentException("Role must be either 'student' or 'teacher'");
        }

        // Validate first and last names
        if (setupDto.getFname() == null || setupDto.getFname().trim().isEmpty()) {
            throw new IllegalArgumentException("First name is required");
        }
        if (setupDto.getLname() == null || setupDto.getLname().trim().isEmpty()) {
            throw new IllegalArgumentException("Last name is required");
        }

        // Update the user's profile
        user.setFname(setupDto.getFname());
        user.setLname(setupDto.getLname());
        user.setRole(setupDto.getRole().toUpperCase()); // store role in lowercase

        // Save and return the updated user
        return userRepository.save(user);
    }

    public boolean isSetupNeeded(Authentication authentication) {
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Only consider setup complete if role is USER_STUDENT or USER_TEACHER
        // Even if firstName and lastName are filled, setup is needed if role is still USER
        return user.getRole() == null || 
               user.getRole().equals("USER") || 
               user.getFname() == null || 
               user.getLname() == null;
    }
}