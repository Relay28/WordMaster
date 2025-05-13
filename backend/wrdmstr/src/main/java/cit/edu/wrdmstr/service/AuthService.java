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

import java.util.Date;

@Service
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );


        UserEntity user = userService.findByEmail(request.getEmail());
        UserDetails userDetails = userService.loadUserByUsername(request.getEmail());

        if(!user.isActive()){
            throw new RuntimeException("Account is Deactivated");
        }
        String jwt = jwtService.generateToken(userDetails);

        return AuthResponse.create(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getLname(),
                user.getLname(),
                user.getRole(),
                user.getProfilePicture()

        );
    }

    public AuthResponse registerUser(RegisterRequest request) {
        // Check if email already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFname(request.getFname());
        user.setLname(request.getLname());
        user.setProfilePicture(request.getProfilePicture());
        user.setCreatedAt(new Date());



        // Save user to database
        UserEntity savedUser = userService.saveUser(user);

        // Create user details for JWT
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getEmail());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFname(),
                savedUser.getLname(),
                savedUser.getRole(),
                user.getProfilePicture()
        );
    }

    public AuthResponse registerUserStudent(RegisterRequest request) {
        // Check if email already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFname(request.getFname());
        user.setLname(request.getLname());
        user.setProfilePicture(request.getProfilePicture());
        user.setCreatedAt(new Date());
        user.setRole("USER_STUDENT");



        // Save user to database
        UserEntity savedUser = userService.saveUser(user);

        // Create user details for JWT
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getEmail());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFname(),
                savedUser.getLname(),
                savedUser.getRole(),
                user.getProfilePicture()
        );
    }


    public AuthResponse registerUserTeacher(RegisterRequest request) {
        // Check if email already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFname(request.getFname());
        user.setLname(request.getLname());
        user.setProfilePicture(request.getProfilePicture());
        user.setCreatedAt(new Date());
        user.setRole("USER_TEACHER");



        // Save user to database
        UserEntity savedUser = userService.saveUser(user);

        // Create user details for JWT
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getEmail());

        // Generate JWT token
        String jwt = jwtService.generateToken(userDetails);

        // Return auth response with token and user information using factory method
        return AuthResponse.create(
                jwt,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFname(),
                savedUser.getLname(),
                savedUser.getRole(),
                user.getProfilePicture()
        );
    }
}
