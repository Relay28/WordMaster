package cit.edu.wrdmstr.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
            // Allow anyone to connect to the WebSocket
            .simpTypeMatchers(SimpMessageType.CONNECT, 
                             SimpMessageType.DISCONNECT, 
                             SimpMessageType.OTHER)
                .permitAll()
            // Require authentication for application messages
            .simpDestMatchers("/app/**")
                .authenticated()
            // Require authentication for subscriptions
            .simpSubscribeDestMatchers("/topic/**", "/user/**", "/queue/**")
                .authenticated()
            // Any other messages require authentication
            .anyMessage()
                .authenticated();
    }

    @Override
    protected boolean sameOriginDisabled() {
        // Disable CSRF for WebSocket connections
        return true;
    }
}