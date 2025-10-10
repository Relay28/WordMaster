package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.AuthRequest;
import cit.edu.wrdmstr.dto.AuthResponse;
import cit.edu.wrdmstr.dto.MicrosoftAuthRequest;
import cit.edu.wrdmstr.dto.RegisterRequest;
import cit.edu.wrdmstr.service.AuthService;
import cit.edu.wrdmstr.service.MicrosoftAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import jakarta.servlet.http.HttpServletResponse;

import cit.edu.wrdmstr.dto.ApiResponse;
import cit.edu.wrdmstr.dto.ChangePasswordRequest;
import cit.edu.wrdmstr.dto.ForgotPasswordRequest;
import cit.edu.wrdmstr.dto.ResetPasswordRequest;
import cit.edu.wrdmstr.service.PasswordResetService;
import org.springframework.security.core.Authentication;

// import javax.servlet.http.HttpServletResponse;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;
    
    @Autowired
    private MicrosoftAuthService microsoftAuthService;
    
    @Value("${spring.security.oauth2.client.registration.azure.client-id}")
    private String clientId;
    
    @Value("${azure.tenant-id}")
    private String tenantId;
    
    @Value("${spring.security.oauth2.client.registration.azure.client-secret}")
    private String clientSecret;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthResponse> registerStudent(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerUserStudent(request));
    }

    @PostMapping("/register/teacher")
    public ResponseEntity<AuthResponse> registerTeacher(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerUserTeacher(request));
    }


    @PostMapping("/microsoft")
    public ResponseEntity<AuthResponse> microsoftAuthentication(@RequestBody MicrosoftAuthRequest request) {
        return ResponseEntity.ok(microsoftAuthService.authenticateWithMicrosoft(request));
    }
    
    @GetMapping("/microsoft/config")
    public ResponseEntity<Map<String, String>> getMicrosoftConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("tenantId", tenantId);
        config.put("redirectUri", "https://wordmaster.duckdns.org/login/oauth2/code/azure");
        config.put("authEndpoint", "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/authorize");
        return ResponseEntity.ok(config);
    }

    @GetMapping("/microsoft/auth-url")
    public ResponseEntity<String> getAuthUrl(HttpServletRequest request) {
        // Dynamically determine frontend URL based on the request
        String referer = request.getHeader("Referer");
        String frontendUrl;
        
        if (referer != null && referer.contains("localhost:5173")) {
            frontendUrl = "http://localhost:5173";
        } else if (referer != null && referer.contains("localhost:3000")) {
            frontendUrl = "http://localhost:3000";
        } else {
            frontendUrl = "https://wordmaster-nu.vercel.app";
        }
        
        String state = Base64.getEncoder().encodeToString(frontendUrl.getBytes());
        
        // Dynamically determine redirect URI based on the request
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String redirectUri;
        
        if ("localhost".equals(serverName) || "127.0.0.1".equals(serverName)) {
            redirectUri = "http://localhost:8080/login/oauth2/code/azure";
        } else {
            redirectUri = "https://wordmaster.duckdns.org/login/oauth2/code/azure";
        }
        
        String authUrl = String.format(
            "https://login.microsoftonline.com/%s/oauth2/v2.0/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=openid%%20profile%%20email%%20User.Read&response_mode=query&state=%s&prompt=select_account",
            tenantId,
            clientId,
            redirectUri,
            state
        );
        return ResponseEntity.ok(authUrl);
    }
    
    @PostMapping("/microsoft/token")
    public ResponseEntity<?> getTokenDirectly(@RequestBody MicrosoftAuthRequest request) {
        logger.info("Direct token request with code length: {}", 
            request.getCode() != null ? request.getCode().length() : "null");
        try {
            //  URI from properties
            String tokenUrl = "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
            formParams.add("client_id", clientId);
            formParams.add("client_secret", clientSecret);
            formParams.add("scope", "https://graph.microsoft.com/.default");
            formParams.add("code", request.getCode());
            formParams.add("redirect_uri", "https://wordmaster.duckdns.org/login/oauth2/code/azure");
            formParams.add("grant_type", "authorization_code");
            
            HttpEntity<MultiValueMap<String, String>> requestEntity = 
                new HttpEntity<>(formParams, headers);
            
            RestTemplate testTemplate = new RestTemplate();
            
            ResponseEntity<Object> response = testTemplate.exchange(
                tokenUrl,
                org.springframework.http.HttpMethod.POST,
                requestEntity,
                Object.class
            );
            
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getName(),
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/login/oauth2/code/azure")
    public void handleOAuth2Callback(@RequestParam String code, 
                                     @RequestParam(required = false) String state,
                                     HttpServletResponse response) throws IOException {
        try {
            logger.info("OAuth2 callback received with code length: {}", code.length());
            
            // Exchange code for token and user info
            AuthResponse authResponse = microsoftAuthService.handleOAuth2Code(code);
            
            // Determine where to redirect (from state parameter or default to frontend URL)
            String redirectUrl = "https://wordmaster-nu.vercel.app/oauth-success";
            
            // Convert the auth response to JSON and encode as base64
            String authJson = convertToJson(authResponse);
            String encodedData = Base64.getEncoder().encodeToString(authJson.getBytes(StandardCharsets.UTF_8));
            
            // Create redirect URL with a single data parameter
            String finalUrl = redirectUrl + "?data=" + encodedData;
            
            logger.info("Redirecting to: {}", redirectUrl);
            
            // Redirect to frontend with encoded data
            response.sendRedirect(finalUrl);
            
        } catch (Exception e) {
            logger.error("Error during OAuth callback handling", e);
            response.sendRedirect("https://wordmaster-nu.vercel.app/login?error=Authentication%20failed");
        }
    }

    // Helper method to convert AuthResponse to JSON
    private String convertToJson(AuthResponse authResponse) {
        try {
            return "{" +
                "\"token\":\"" + authResponse.getToken() + "\"," +
                "\"id\":" + authResponse.getId() + "," +
                "\"email\":\"" + authResponse.getEmail() + "\"," +
                "\"fname\":\"" + authResponse.getFname() + "\"," +
                "\"lname\":\"" + authResponse.getLname() + "\"," +
                "\"role\":\"" + authResponse.getRole() + "\"" +
                "}";
        } catch (Exception e) {
            logger.error("Error converting AuthResponse to JSON", e);
            throw new RuntimeException("Failed to serialize auth response", e);
        }
    }

    // Add these methods to your AuthController
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        boolean success = passwordResetService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());

        if (success) {
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully"));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Current password is incorrect"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean success = passwordResetService.sendResetCode(request.getEmail());

        if (success) {
            return ResponseEntity.ok(new ApiResponse(true, "Reset code sent successfully"));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Email not found"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        boolean success = passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());

        if (success) {
            return ResponseEntity.ok(new ApiResponse(true, "Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid or expired reset code"));
        }
    }
}