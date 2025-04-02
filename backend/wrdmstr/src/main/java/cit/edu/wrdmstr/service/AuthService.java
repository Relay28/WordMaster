package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.AuthRequest;
import cit.edu.wrdmstr.dto.AuthResponse;
import cit.edu.wrdmstr.dto.RegisterRequest;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse login(AuthRequest request) {
        // Authenticate user credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // Set authentication in the security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get user details
        UserDetails userDetails = userService.loadUserByUsername(request.getUsername());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Get user from database
        UserEntity user = userService.findByUsername(request.getUsername());

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }

    public AuthResponse registerTeacher(RegisterRequest request) {
        // Check if username already exists
        if (userService.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        // Check if email already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setName(request.getName());
        user.setRole("USER_TEACHER");
        user.setProfilePicture(request.getProfilePicture());

        // Save user to database
        UserEntity savedUser = userService.saveUser(user);

        // Create user details for JWT
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getUsername());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getRole()
        );
    }

    public AuthResponse registerStudent(RegisterRequest request) {
        // Check if username already exists
        if (userService.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        // Check if email already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setName(request.getName());
        user.setRole("USER_STUDENT");
        user.setProfilePicture(request.getProfilePicture());

        // Save user to database
        UserEntity savedUser = userService.saveUser(user);

        // Create user details for JWT
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getUsername());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getRole()
        );
    }
}