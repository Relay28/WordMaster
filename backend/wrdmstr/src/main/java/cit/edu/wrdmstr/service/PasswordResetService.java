package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.PasswordResetToken;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.PasswordResetTokenRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public boolean changePassword(String email, String currentPassword, String newPassword) {
        logger.info("Changing password for user: {}", email);

        Optional<UserEntity> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            logger.error("User not found with email: {}", email);
            return false;
        }

        UserEntity user = userOptional.get();

        // Check if current password matches
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            logger.warn("Current password does not match for user: {}", email);
            return false;
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logger.info("Password changed successfully for user: {}", email);
        return true;
    }

    public boolean sendResetCode(String email) {
        logger.info("Sending reset code to email: {}", email);

        Optional<UserEntity> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            logger.error("User not found with email: {}", email);
            return false;
        }

        UserEntity user = userOptional.get();

        // Generate 6-digit code
        String code = generateRandomCode();

        // Save token in the database
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(code);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(15)); // Expires in 15 minutes
        tokenRepository.save(token);

        logger.info("Reset code generated for user: {}", email);

        // Send email with code if mail sender is configured
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("WordMaster - Password Reset Code");
                message.setText("Your password reset code is: " + code + "\n\n" +
                        "This code will expire in 15 minutes. If you did not request this, please ignore this email.");

                mailSender.send(message);
                logger.info("Reset code email sent to: {}", email);
            } catch (Exception e) {
                logger.error("Failed to send reset code email", e);
                // Still return true since the code was generated successfully
            }
        } else {
            logger.warn("JavaMailSender not configured, skipping email send");
            // For development, log the code
            logger.info("Development mode: Reset code for {} is: {}", email, code);
        }

        return true;
    }

    public boolean resetPassword(String email, String code, String newPassword) {
        logger.info("Resetting password with code for user: {}", email);

        Optional<UserEntity> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            logger.error("User not found with email: {}", email);
            return false;
        }

        UserEntity user = userOptional.get();

        // Verify code
        PasswordResetToken token = tokenRepository.findByUserAndToken(user, code);

        if (token == null) {
            logger.warn("Reset token not found for user: {}", email);
            return false;
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            logger.warn("Reset token expired for user: {}", email);
            return false;
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete used token
        tokenRepository.delete(token);

        logger.info("Password reset successfully for user: {}", email);
        return true;
    }

    private String generateRandomCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 6-digit code
        return String.valueOf(code);
    }
}