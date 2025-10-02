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
import org.springframework.http.HttpHeaders;
import cit.edu.wrdmstr.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import java.security.Principal;

import java.util.Map;
import java.util.List;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;

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
                .setAllowedOrigins(
                    "http://localhost:5173",           // Local development
                    "http://localhost:3000",           // Alternative local port
                    "https://wordmaster-nu.vercel.app" // Production deployment
                )
                .addInterceptors(new JwtHandshakeInterceptor(jwtService))
                .setHandshakeHandler(new CustomHandshakeHandler())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract auth header from STOMP headers
                    List<String> authHeaders = accessor.getNativeHeader("Authorization");
                    if (authHeaders != null && !authHeaders.isEmpty()) {
                        String token = authHeaders.get(0);
                        if (token != null && token.startsWith("Bearer ")) {
                            token = token.substring(7);
                            if (jwtService.validateToken(token)) {
                                String username = jwtService.extractUsername(token);
                                Authentication auth = new UsernamePasswordAuthenticationToken(username, null, null);
                                accessor.setUser(auth);
                            }
                        }
                    }
                }
                return message;
            }
        });
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

    // Custom HandshakeInterceptor to extract JWT from query param or header
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

            // First try to get token from query parameter
            if (request instanceof ServletServerHttpRequest servletRequest) {
                String token = servletRequest.getServletRequest().getParameter("token");

                // If not in query parameter, try the Authorization header
                if (token == null) {
                    HttpHeaders headers = request.getHeaders();
                    List<String> authorization = headers.get("Authorization");
                    if (authorization != null && !authorization.isEmpty()) {
                        String authHeader = authorization.get(0);
                        if (authHeader.startsWith("Bearer ")) {
                            token = authHeader.substring(7);
                        }
                    }
                }

                // Validate token and set principal
                if (token != null && jwtService.validateToken(token)) {
                    String username = jwtService.extractUsername(token);
                    Authentication auth = new UsernamePasswordAuthenticationToken(username, null, null);
                    attributes.put("principal", auth);
                    return true;
                }
            }

            // Allow connection without authentication for public endpoints if needed
            // Return false to reject connection if authentication is required
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