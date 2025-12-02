package cit.edu.wrdmstr.service;

import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2UserService.class);

    @Autowired
    private UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Extract details from Microsoft response
        Map<String, Object> attributes = oAuth2User.getAttributes();
        logger.debug("OAuth2 attributes received: {}", attributes);
        
        String email = (String) attributes.get("mail");
        if (email == null) {
            // Fall back to preferred username if mail not available
            email = (String) attributes.get("userPrincipalName");
            
            // Fall back to preferred_username (from ID token)
            if (email == null) {
                email = (String) attributes.get("preferred_username");
            }
        }
        
        if (email == null) {
            logger.error("Could not extract email from OAuth2 attributes: {}", attributes);
            throw new OAuth2AuthenticationException("Email not available in user details");
        }
        
        String name = (String) attributes.get("displayName");
        String firstName = name;
        String lastName = "";
        
        if (name != null && name.contains(" ")) {
            String[] nameParts = name.split(" ", 2);
            firstName = nameParts[0];
            lastName = nameParts[1];
        }

        if (!userService.existsByEmail(email)) {
            UserEntity user = new UserEntity();
            user.setEmail(email);
            user.setPassword(java.util.UUID.randomUUID().toString());
            // Don't set fname/lname here - let user confirm/edit in setup page
            // Set role to "USER" to indicate setup is required
            user.setRole("USER");
            user.setVerified(true); // OAuth users are pre-verified by Microsoft
            userService.saveUser(user);
            logger.info("Created new OAuth user with email: {} - setup required", email);
        }

        return oAuth2User;
    }
}
