package cit.edu.wrdmstr.config;

import cit.edu.wrdmstr.security.JwtAuthenticationFilter;
import cit.edu.wrdmstr.service.UserService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserService userService;
    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(@Lazy UserService userService, JwtAuthenticationFilter jwtAuthFilter) {
        this.userService = userService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf
            .ignoringRequestMatchers(
                "/api/auth/**",
                "/login/oauth2/code/azure",
                "/api/**",
                "/ws/**"
            )
        )
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**").permitAll()
            .requestMatchers("/api/auth/**", "/login/oauth2/code/azure").permitAll()
            .requestMatchers("/api/grammar/check").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/ws/**").permitAll()
            .requestMatchers("/api/sessions/**").authenticated()
            .requestMatchers("/api/export/**").permitAll()
            .anyRequest().authenticated());

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Add your Vercel URL to allowed origins
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",           // Local development
            "http://localhost:3000",           // Alternative local port
            "https://wordmaster-nu.vercel.app", // Your Vercel deployment
            "http://3.26.165.228:8080"          // EC2 backend (if needed for direct access)

        ));

        // Allow only necessary HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow specific headers only - add cache-control header
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "Pragma", "Expires", "X-Requested-With"));
        
        // Expose headers that frontend might need to access
        configuration.setExposedHeaders(List.of("Cache-Control", "Content-Type", "Authorization"));

        // Allow credentials (JWT tokens, sessions)
        configuration.setAllowCredentials(true);

        // Register CORS for both /api/** and /ws/**
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        source.registerCorsConfiguration("/ws/**", configuration);
        source.registerCorsConfiguration("/ws", configuration);
        return source;
    }

    @Bean
    public Filter loggingFilter() {
        return new Filter() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                    throws IOException, ServletException {
                HttpServletRequest req = (HttpServletRequest) request;
                System.out.println("Request: " + req.getMethod() + " " + req.getRequestURI());
                System.out.println("Authorization: " + req.getHeader("Authorization"));
                chain.doFilter(request, response);
            }
        };
    }

}