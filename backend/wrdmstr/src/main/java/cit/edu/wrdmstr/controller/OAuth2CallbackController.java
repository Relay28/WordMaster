package cit.edu.wrdmstr.controller;

import cit.edu.wrdmstr.dto.AuthResponse;
import cit.edu.wrdmstr.dto.AuthResponseSimplified;
import cit.edu.wrdmstr.service.MicrosoftAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Base64;

@Controller
public class OAuth2CallbackController {
    
    private static final Logger logger = LoggerFactory.getLogger(OAuth2CallbackController.class);
    
    @Autowired
    private MicrosoftAuthService microsoftAuthService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @GetMapping("/login/oauth2/code/azure")
    public RedirectView handleOAuth2Callback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state) {
        
        logger.info("Received OAuth2 callback with code at registered path");
        
        try {
            //Process the auth code
            AuthResponse authResponse = microsoftAuthService.handleOAuth2Code(code);
            
            // Create simplified response without profile picture to reduce header size
            // The profile picture can be large and causes "HeadersTooLargeException"
            // when passed through URL parameters. Frontend can fetch it separately via /api/profile
            AuthResponseSimplified simplifiedResponse = AuthResponseSimplified.fromAuthResponse(authResponse);
            
            //Convert simplified auth response to JSON
            String authJson = objectMapper.writeValueAsString(simplifiedResponse);
            String encodedAuth = Base64.getEncoder().encodeToString(authJson.getBytes());
            
            String frontendUrl = "http://localhost:5173"; 
            if (state != null && !state.isEmpty()) {
                try {
                    frontendUrl = new String(Base64.getDecoder().decode(state));
                    if (!frontendUrl.startsWith("http")) {
                        frontendUrl = "http://localhost:5173";
                    }
                } catch (Exception e) {
                    logger.warn("Could not decode state parameter: {}", e.getMessage());
                }
            }
            
//            logger.info("Redirecting to frontend: {}", frontendUrl + "/oauth-success?data=" + encodedAuth);
            
            return new RedirectView(frontendUrl + "/oauth-success?data=" + encodedAuth);
            
        } catch (Exception e) {
            logger.error("Error processing OAuth2 callback", e);
            return new RedirectView("http://localhost:5173/login?error=authentication_failed");
        }
    }
}
