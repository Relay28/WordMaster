package cit.edu.wrdmstr.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import cit.edu.wrdmstr.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import java.security.Principal;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtService jwtService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("http://localhost:5173")
            .addInterceptors(new JwtHandshakeInterceptor(jwtService))
            .setHandshakeHandler(new CustomHandshakeHandler()) // <-- Add this
            .withSockJS();
    }

    // Custom HandshakeHandler to use the principal from handshake attributes
    private static class CustomHandshakeHandler extends DefaultHandshakeHandler {
        @Override
        protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
            Object principal = attributes.get("principal");
            if (principal instanceof Principal) {
                return (Principal) principal;
            }
            if (principal instanceof Authentication) {
                return (Authentication) principal;
            }
            if (principal instanceof String) {
                return () -> (String) principal;
            }
            return super.determineUser(request, wsHandler, attributes);
        }
    }

    // Custom HandshakeInterceptor to extract JWT from query param
    public static class JwtHandshakeInterceptor implements HandshakeInterceptor {
        private final JwtService jwtService;

        public JwtHandshakeInterceptor(JwtService jwtService) {
            this.jwtService = jwtService;
        }

        @Override
        public boolean beforeHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes) throws Exception {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                String token = servletRequest.getServletRequest().getParameter("token");
                if (token != null && jwtService.extractUsername(token) != null) {
                    String username = jwtService.extractUsername(token);
                    Authentication auth = new UsernamePasswordAuthenticationToken(username, null, null);
                    attributes.put("principal", auth);
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Exception exception) {
            // No-op
        }
    }
}