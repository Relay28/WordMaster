//package cit.edu.wrdmstr.service;
//
//import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
//import cit.edu.wrdmstr.entity.UserEntity;
//import cit.edu.wrdmstr.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.access.AccessDeniedException;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//@Service
//public class ProfileService {
//
//    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;
//
//    @Autowired
//    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
//        this.userRepository = userRepository;
//        this.passwordEncoder = passwordEncoder;
//    }
//
//    public UserEntity getAuthenticatedUserProfile(Authentication authentication) {
//        String username = authentication.getName();
//        return userRepository.findByUsername(username)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
//    }
//
//    public UserEntity updateAuthenticatedUserProfile(Authentication authentication, UserProfileUpdateDto updateDto) {
//        String username = authentication.getName();
//        UserEntity user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//
//        if (updateDto.getName() != null) {
//            user.setName(updateDto.getName());
//        }
//        if (updateDto.getEmail() != null) {
//            // Check if email is already taken by another user
//            if (userRepository.existsByEmailAndUsernameNot(updateDto.getEmail(), username)) {
//                throw new IllegalArgumentException("Email is already in use by another account");
//            }
//            user.setEmail(updateDto.getEmail());
//        }
//        if (updateDto.getProfilePicture() != null) {
//            user.setProfilePicture(updateDto.getProfilePicture());
//        }
//        if (updateDto.getNewPassword() != null && !updateDto.getNewPassword().isEmpty()) {
//            validatePasswordChange(user, updateDto.getCurrentPassword(), updateDto.getNewPassword());
//            user.setPassword(passwordEncoder.encode(updateDto.getNewPassword()));
//        }
//
//        return userRepository.save(user);
//    }
//
//    public void deactivateAuthenticatedUser(Authentication authentication) {
//        String username = authentication.getName();
//        UserEntity user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//
//        // For multi-user safety, verify again that we're acting on the correct user
//        if (!user.getUsername().equals(authentication.getName())) {
//            throw new SecurityException("Unauthorized profile deactivation attempt");
//        }
//
//        // Soft delete approach (recommended)
//        user.setActive(false);
//        userRepository.save(user);
//
//        // Alternative hard delete:
//        // userRepository.delete(user);
//    }
//
//    private void validatePasswordChange(UserEntity user, String currentPassword, String newPassword) {
//        if (currentPassword == null || currentPassword.isEmpty()) {
//            throw new IllegalArgumentException("Current password is required to change password");
//        }
//        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
//            throw new IllegalArgumentException("Current password is incorrect");
//        }
//        if (newPassword.length() < 8) {
//            throw new IllegalArgumentException("New password must be at least 8 characters long");
//        }
//    }
//}