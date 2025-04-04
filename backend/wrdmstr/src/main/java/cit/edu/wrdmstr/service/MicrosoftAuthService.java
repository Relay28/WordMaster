package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.dto.AuthResponse;
import cit.edu.wrdmstr.dto.MicrosoftAuthRequest;
import cit.edu.wrdmstr.entity.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.logging.Level;

@Service
public class MicrosoftAuthService {

    private static final Logger logger = LoggerFactory.getLogger(MicrosoftAuthService.class);

    @Value("${spring.security.oauth2.client.registration.azure.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.azure.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.provider.azure.token-uri}")
    private String tokenUri;

    @Value("${azure.tenant-id}")
    private String tenantId;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Autowired
    private RestTemplate restTemplate;

    public AuthResponse authenticateWithMicrosoft(MicrosoftAuthRequest request) {
        try {
            // Exchange code for tokens
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("scope", "User.Read");
            body.add("code", request.getCode());
            body.add("redirect_uri", request.getRedirectUri());
            body.add("grant_type", "authorization_code");
            body.add("client_secret", clientSecret);

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

            logger.info("Exchanging code for token with Microsoft");
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUri, requestEntity, Map.class);

            String accessToken = (String) response.getBody().get("access_token");

            // Get user info
            String userInfoEndpoint = "https://graph.microsoft.com/v1.0/me";
            HttpHeaders userInfoHeaders = new HttpHeaders();
            userInfoHeaders.setBearerAuth(accessToken);

            HttpEntity<String> userInfoRequestEntity = new HttpEntity<>(userInfoHeaders);
            ResponseEntity<Map> userResponse = restTemplate.exchange(
                userInfoEndpoint,
                org.springframework.http.HttpMethod.GET,
                userInfoRequestEntity,
                Map.class
            );

            Map<String, Object> userAttributes = userResponse.getBody();
            logger.info("Received user information from Microsoft Graph API");

            // Extract user data
            String email = (String) userAttributes.get("mail");
            if (email == null) {
                email = (String) userAttributes.get("userPrincipalName");
            }

            String displayName = (String) userAttributes.get("displayName");
            String firstName = displayName;
            String lastName = "";

            if (displayName != null && displayName.contains(" ")) {
                String[] nameParts = displayName.split(" ", 2);
                firstName = nameParts[0];
                lastName = nameParts[1];
            }

            // Check if user exists, create if not
            UserEntity user;
            if (!userService.existsByEmail(email)) {
                logger.info("Creating new user with email: " + email);
                UserEntity newUser = new UserEntity();
                newUser.setEmail(email);
                newUser.setPassword(java.util.UUID.randomUUID().toString());
                newUser.setFname(firstName);
                newUser.setLname(lastName);
                newUser.setRole("USER"); // Changed from USER_STUDENT to USER
                user = userService.saveUser(newUser);
            } else {
                logger.info("User already exists with email: " + email);
                user = userService.findByEmail(email);
            }

            // Generate JWT token
            String jwt = jwtService.generateToken(userService.loadUserByUsername(email));

            // Return auth response
            return AuthResponse.create(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getFname(),
                user.getLname(),
                user.getRole()
            );
        } catch (RestClientException e) {
            logger.error("Error during Microsoft authentication", e);
            throw new RuntimeException("Failed to authenticate with Microsoft: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error during Microsoft authentication", e);
            throw new RuntimeException("An error occurred during authentication: " + e.getMessage(), e);
        }
    }

    public AuthResponse handleOAuth2Code(String code) {
        logger.info("Exchanging authorization code for tokens");

        try {
            // Use the configured token URI from properties
            String tokenUrl = "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token";
            
            // Clean up client ID to ensure no unwanted characters
            String cleanClientId = clientId.trim();
            
            logger.info("Token URL: {}", tokenUrl);
            logger.info("Client ID: {}", cleanClientId);
            logger.info("Redirect URI: http://localhost:8080/login/oauth2/code/azure");
            logger.info("Code length: {}", code.length());
            
            // Create specific headers for token request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            // Build the form parameters exactly as Microsoft expects
            MultiValueMap<String, String> formParams = new LinkedMultiValueMap<>();
            formParams.add("client_id", cleanClientId);
            formParams.add("client_secret", clientSecret);
            formParams.add("scope", "https://graph.microsoft.com/.default openid profile email");
            formParams.add("code", code);
            formParams.add("redirect_uri", "http://localhost:8080/login/oauth2/code/azure");
            formParams.add("grant_type", "authorization_code");
            
            // Create the request entity
            HttpEntity<MultiValueMap<String, String>> requestEntity = 
                new HttpEntity<>(formParams, headers);
            
            logger.info("Sending token request to Microsoft");
            
            // Use a simple direct HTTP client for test
            try {
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) 
                    new java.net.URL(tokenUrl).openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                conn.setDoOutput(true);
                
                // Prepare the form data with cleaned client ID
                StringBuilder formData = new StringBuilder();
                formData.append("client_id=").append(java.net.URLEncoder.encode(cleanClientId, "UTF-8"));
                formData.append("&client_secret=").append(java.net.URLEncoder.encode(clientSecret, "UTF-8"));
                formData.append("&scope=").append(java.net.URLEncoder.encode("https://graph.microsoft.com/.default", "UTF-8"));
                formData.append("&code=").append(java.net.URLEncoder.encode(code, "UTF-8"));
                formData.append("&redirect_uri=").append(java.net.URLEncoder.encode("http://localhost:8080/login/oauth2/code/azure", "UTF-8"));
                formData.append("&grant_type=authorization_code");
                
                // Send the data
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(formData.toString().getBytes("UTF-8"));
                }
                
                // Get the response
                int responseCode = conn.getResponseCode();
                logger.info("Direct HTTP request response code: {}", responseCode);
                
                String responseBody;
                if (responseCode >= 200 && responseCode < 300) {
                    try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                        responseBody = br.lines().collect(java.util.stream.Collectors.joining());
                    }
                } else {
                    try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getErrorStream(), "UTF-8"))) {
                        responseBody = br.lines().collect(java.util.stream.Collectors.joining());
                    }
                }
                
                logger.info("Direct HTTP response body: {}", responseBody);
                
                // If direct HTTP request failed, try with RestTemplate as fallback
                if (responseCode != 200) {
                    logger.info("Falling back to RestTemplate");
                    // Rest of the code will execute
                } else {
                    // Parse the response JSON
                    Map<String, Object> response = new org.springframework.boot.json.JacksonJsonParser()
                        .parseMap(responseBody);
                    
                    String accessToken = (String) response.get("access_token");
                    logger.info("Access token received: {}", accessToken != null);
                    
                    return getUserInfoAndAuthenticate(accessToken);
                }
            } catch (Exception e) {
                logger.error("Direct HTTP request failed", e);
                // Continue with RestTemplate as fallback
            }
            
            // Try with RestTemplate
            ResponseEntity<String> stringResponse = restTemplate.exchange(
                tokenUrl,
                org.springframework.http.HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            logger.info("Token response status: {}", stringResponse.getStatusCode());
            logger.info("Token response body: {}", stringResponse.getBody());
            
            // Convert the response to a map
            Map<String, Object> response = new org.springframework.boot.json.JacksonJsonParser()
                .parseMap(stringResponse.getBody());
            
            String accessToken = (String) response.get("access_token");
            logger.info("Access token received: {}", accessToken != null);
            
            return getUserInfoAndAuthenticate(accessToken);
        } catch (Exception e) {
            logger.error("Error during token exchange", e);
            throw new RuntimeException("Failed to authenticate with Microsoft: " + e.getMessage(), e);
        }
    }

    private AuthResponse getUserInfoAndAuthenticate(String accessToken) {
        try {
            // Get user info
            String userInfoEndpoint = "https://graph.microsoft.com/v1.0/me";
            HttpHeaders userInfoHeaders = new HttpHeaders();
            userInfoHeaders.setBearerAuth(accessToken);

            HttpEntity<String> userInfoRequestEntity = new HttpEntity<>(userInfoHeaders);
            ResponseEntity<Map> userResponse = restTemplate.exchange(
                userInfoEndpoint,
                org.springframework.http.HttpMethod.GET,
                userInfoRequestEntity,
                Map.class
            );

            Map<String, Object> userAttributes = userResponse.getBody();
            logger.info("Received user information from Microsoft Graph API");

            // Extract user data
            String email = (String) userAttributes.get("mail");
            if (email == null) {
                email = (String) userAttributes.get("userPrincipalName");
            }

            String displayName = (String) userAttributes.get("displayName");
            String firstName = displayName;
            String lastName = "";

            if (displayName != null && displayName.contains(" ")) {
                String[] nameParts = displayName.split(" ", 2);
                firstName = nameParts[0];
                lastName = nameParts[1];
            }

            // Check if user exists, create if not
            UserEntity user;
            if (!userService.existsByEmail(email)) {
                logger.info("Creating new user with email: " + email);
                UserEntity newUser = new UserEntity();
                newUser.setEmail(email);
                newUser.setPassword(java.util.UUID.randomUUID().toString());
                newUser.setFname(firstName);
                newUser.setLname(lastName);
                newUser.setRole("USER"); // Changed from USER_STUDENT to USER
                user = userService.saveUser(newUser);
            } else {
                logger.info("User already exists with email: " + email);
                user = userService.findByEmail(email);
            }

            // Generate JWT token
            String jwt = jwtService.generateToken(userService.loadUserByUsername(email));

            // Return auth response
            return AuthResponse.create(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getFname(),
                user.getLname(),
                user.getRole()
            );
        } catch (Exception e) {
            logger.error("Error processing user information", e);
            throw new RuntimeException("Failed to process user information: " + e.getMessage(), e);
        }
    }
}
