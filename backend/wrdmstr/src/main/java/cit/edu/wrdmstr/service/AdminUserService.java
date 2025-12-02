package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.AdminCreateDto;
import cit.edu.wrdmstr.dto.UserCreateDto;
import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.dto.UserUpdateDto;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Verify admin access
    private void verifyAdminAccess(Authentication authentication) {
        UserEntity admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            throw new AccessDeniedException("Only ADMIN users can access this functionality");
        }
    }

    // Get all users (for admin dashboard)
    public List<UserDto> getAllUsers(Authentication authentication) {
        verifyAdminAccess(authentication);
        return userRepository.findAll().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    // Get user by ID
    public UserDto getUserById(Authentication authentication, Long userId) {
        verifyAdminAccess(authentication);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        return new UserDto(user);
    }

    // Create new user (admin can create users of any role)
    public UserDto createUser(Authentication authentication, UserCreateDto userCreateDto) {
        verifyAdminAccess(authentication);
        if (userRepository.existsByEmail(userCreateDto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        UserEntity user = new UserEntity();
        user.setEmail(userCreateDto.getEmail());
        user.setPassword(passwordEncoder.encode(userCreateDto.getPassword()));
        user.setFname(userCreateDto.getFname());
        user.setLname(userCreateDto.getLname());
        user.setRole(userCreateDto.getRole());
        user.setCreatedAt(new Date());
        user.setActive(userCreateDto.isActive());
        user.setProfilePicture(userCreateDto.getProfilePicture());
        user.setVerified(true); // Admin-created accounts are auto-verified, no OTP needed

        return new UserDto(userRepository.save(user));
    }

    // Update existing user
    public UserDto updateUser(Authentication authentication, Long userId, UserUpdateDto updateDto) {
        verifyAdminAccess(authentication);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (updateDto.getFname() != null) {
            user.setFname(updateDto.getFname());
        }
        if (updateDto.getLname() != null) {
            user.setLname(updateDto.getLname());
        }
        if (updateDto.getEmail() != null && !updateDto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updateDto.getEmail())) {
                throw new IllegalArgumentException("Email is already in use by another account");
            }
            user.setEmail(updateDto.getEmail());
        }
        if (updateDto.getRole() != null) {
            user.setRole(updateDto.getRole());
        }
        if (updateDto.getProfilePicture() != null) {
            user.setProfilePicture(updateDto.getProfilePicture());
        }
        if (updateDto.getNewPassword() != null && !updateDto.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateDto.getNewPassword()));
        }
        if (updateDto.isActive() !=null) {
            user.setActive(updateDto.isActive());
        }

        return new UserDto(userRepository.save(user));
    }

    // Deactivate user (soft delete)
    public void deactivateUser(Authentication authentication, Long userId) {
        verifyAdminAccess(authentication);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setActive(false);
        userRepository.save(user);
    }

    // Activate user
    public void activateUser(Authentication authentication, Long userId) {
        verifyAdminAccess(authentication);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setActive(true);
        userRepository.save(user);
    }

    // Delete user permanently
    public void deleteUser(Authentication authentication, Long userId) {
        verifyAdminAccess(authentication);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Check if user is a teacher with classrooms
        if (!user.getTaughtClassrooms().isEmpty()) {
            throw new IllegalStateException("Cannot delete user with existing classrooms. Reassign classrooms first.");
        }


        userRepository.deleteById(userId);
    }

    public UserDto createFirstAdmin(AdminCreateDto adminCreateDto) {
        // Check if any admin already exists
        if (userRepository.existsByRole("ADMIN")) {
            throw new IllegalStateException("Admin accounts already exist. Use the regular admin endpoint for creating additional admins.");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(adminCreateDto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Create a new UserEntity for admin
        UserEntity admin = new UserEntity();
        admin.setEmail(adminCreateDto.getEmail());
        admin.setPassword(passwordEncoder.encode(adminCreateDto.getPassword())); // Make sure to encode the password
        admin.setFname(adminCreateDto.getFname());
        admin.setLname(adminCreateDto.getLname());
        admin.setRole("ADMIN");
        admin.setCreatedAt(new Date());
        admin.setActive(true);
        admin.setVerified(true); // Admin accounts are auto-verified, no OTP needed

        // Save the admin entity
        UserEntity savedAdmin = userRepository.save(admin);

        return new UserDto(savedAdmin);
    }

    public UserDto registerAdmin(AdminCreateDto adminCreateDto) {
        // Check if email already exists
        if (userRepository.existsByEmail(adminCreateDto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Create a new UserEntity for admin
        UserEntity admin = new UserEntity();
        admin.setEmail(adminCreateDto.getEmail());
        admin.setPassword(passwordEncoder.encode(adminCreateDto.getPassword()));
        admin.setFname(adminCreateDto.getFname());
        admin.setLname(adminCreateDto.getLname());
        admin.setRole("ADMIN");
        admin.setCreatedAt(new Date());
        admin.setActive(true);
        admin.setVerified(true); // Admin accounts are auto-verified, no OTP needed

        // Save the admin entity
        UserEntity savedAdmin = userRepository.save(admin);

        return new UserDto(savedAdmin);
    }

    private UserDto createAdminAccount(AdminCreateDto adminCreateDto) {
        // Check if email already exists
        if (userRepository.existsByEmail(adminCreateDto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Create a new UserEntity for admin
        UserEntity admin = new UserEntity();
        admin.setEmail(adminCreateDto.getEmail());
        admin.setPassword(passwordEncoder.encode(adminCreateDto.getPassword()));
        admin.setFname(adminCreateDto.getFname());
        admin.setLname(adminCreateDto.getLname());
        admin.setRole("ADMIN");
        admin.setActive(true);

        // Save the admin entity
        UserEntity savedAdmin = userRepository.save(admin);

        // Convert UserEntity to AdminCreateDto and return
        return new UserDto(savedAdmin);
    }

}