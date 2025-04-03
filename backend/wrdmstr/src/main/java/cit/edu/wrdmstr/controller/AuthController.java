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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
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

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/registerAsStudent")
    public ResponseEntity<AuthResponse> registerStudent(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerStudent(request));
    }

    @PostMapping("/registerAsTeacher")
    public ResponseEntity<AuthResponse> registerTeacher(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerTeacher(request));
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
        config.put("redirectUri", "http://localhost:8080/login/oauth2/code/azure");
        config.put("authEndpoint", "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/authorize");
        return ResponseEntity.ok(config);
    }

    @GetMapping("/microsoft/auth-url")
    public ResponseEntity<String> getAuthUrl() {

        String frontendUrl = "http://localhost:5173"; 
        String state = Base64.getEncoder().encodeToString(frontendUrl.getBytes());
        
        String authUrl = String.format(
            "https://login.microsoftonline.com/%s/oauth2/v2.0/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=openid%%20profile%%20email%%20User.Read&response_mode=query&state=%s",
            tenantId,
            clientId,
            "http://localhost:8080/login/oauth2/code/azure",
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
            formParams.add("redirect_uri", "http://localhost:8080/login/oauth2/code/azure");
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
}