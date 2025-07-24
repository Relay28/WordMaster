package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.model.OtpVerification;
import cit.edu.wrdmstr.entity.UserEntity;
import cit.edu.wrdmstr.repository.OtpVerificationRepository;
import cit.edu.wrdmstr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.mail.internet.MimeMessage;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private OtpVerificationRepository otpRepo;

    @Autowired
    private UserRepository userRepo;

    private final Map<String, LocalDateTime> lastOtpSentTime = new ConcurrentHashMap<>();

    public void sendOtp(String email) {
        UserEntity user = userRepo.findByEmail(email).orElse(null);
        String userName = user != null ? user.getFname() + " " + user.getLname() : "User";
        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        OtpVerification otpVerification = new OtpVerification();
        otpVerification.setEmail(email);
        otpVerification.setOtp(otp);
        otpVerification.setExpiry(expiry);
        otpVerification.setVerified(false);

        otpRepo.save(otpVerification);

        if (lastOtpSentTime.containsKey(email)) {
            LocalDateTime lastSent = lastOtpSentTime.get(email);
            if (lastSent.plusMinutes(1).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Please wait before requesting another OTP");
            }
        }

        // Email HTML template
        String htmlContent = "<div style='font-family:\"Press Start 2P\", Arial, sans-serif; background:#f9f9f9; padding:32px; border-radius:16px; max-width:480px; margin:auto; box-shadow:0 8px 32px rgba(95,75,139,0.15);'>" +
                "<div style='text-align:center;'>" +
                "<img src='https://i.imgur.com/hoX8bE1.png' alt='WordMaster Logo' style='height:60px; margin-bottom:16px;'/>" +
                "<h2 style='color:#5F4B8B; margin-bottom:8px; font-family:\"Press Start 2P\", Arial, sans-serif;'>WORDMASTER</h2>" +
                "</div>" +
                "<p style='color:#4a5568; font-size:16px; text-align:center; margin-bottom:24px;'>Hi <b>" + userName + "</b>,<br>To proceed further with your registration, please enter the OTP below.</p>" +
                "<div style='background:#5F4B8B; color:white; font-size:28px; font-family:\"Press Start 2P\", Arial, sans-serif; border-radius:8px; padding:16px 0; text-align:center; letter-spacing:2px; margin-bottom:16px;'>" +
                otp +
                "</div>" +
                "<p style='color:#4a5568; font-size:14px; text-align:center; margin-bottom:24px;'>This OTP will only be valid for <b>5 minutes</b>.</p>" +
                "<hr style='border:none; border-top:1px solid #eee; margin:24px 0;'/>" +
                "<p style='font-size:12px; color:#888; text-align:center;'>If you did not request this, please ignore this email.<br>For help, contact us at <a href='mailto:citu.wordmaster@gmail.com' style='color:#5F4B8B;'>citu.wordmaster@gmail.com</a></p>" +
                "<div style='text-align:center; margin-top:24px; color:#5F4B8B; font-size:13px;'>Cheers,<br>WordMaster Team</div>" +
                "</div>";

        // Plain text alternative
        String textContent = "Hi " + userName + ",\n\n" +
                "Your WordMaster OTP code is: " + otp + "\n" +
                "This code will expire in 5 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n" +
                "For help, contact us at support@wordmaster.com";

        // Send OTP to user's email
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(email);
            helper.setSubject("Your WordMaster OTP Code");
            helper.setText("Your OTP code is: " + otp + "\nThis code will expire in 5 minutes.", false);
            helper.setText(textContent, htmlContent);
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Failed to send OTP email: " + e.getMessage());
        }

        lastOtpSentTime.put(email, LocalDateTime.now());
    }

    // Verify OTP
    public boolean verifyOtp(String email, String otp) {
        OtpVerification otpVerification = otpRepo.findByEmailAndOtpAndVerifiedFalse(email, otp)
                .orElse(null);

        if (otpVerification == null) return false;
        if (otpVerification.getExpiry().isBefore(LocalDateTime.now())) return false;

        // Mark OTP as used
        otpVerification.setVerified(true);
        otpRepo.save(otpVerification);

        // Mark user as verified
        UserEntity user = userRepo.findByEmail(email).orElse(null);
        if (user == null) return false;
        user.setVerified(true);
        userRepo.save(user);

        return true;
    }

    // Check if user is verified
    public boolean isUserVerified(String email) {
        UserEntity user = userRepo.findByEmail(email).orElse(null);
        return user != null && user.isVerified();
    }


}