package cit.edu.wrdmstr.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Random;

@Configuration
public class AppConfig implements WebMvcConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class);


    @Bean
    public Random random() {
        return new Random();
    }
    @Value("${ai.http.connection-timeout:3000}")
    private int connectionTimeout;

    @Value("${ai.http.read-timeout.long:8000}")
    private int readTimeout;

    @Value("${ai.http.max-connections:50}")
    private int maxConnections;

    @Value("${ai.http.max-connections-per-route:20}")
    private int maxConnectionsPerRoute;

    @Bean
    public RestTemplate restTemplate() {
        // Use Apache HttpClient with pooling to reduce handshake latency
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setMaxTotal(maxConnections);
        cm.setDefaultMaxPerRoute(maxConnectionsPerRoute);
        cm.closeIdle(TimeValue.ofSeconds(30));

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(cm)
                .evictExpiredConnections()
                .setDefaultRequestConfig(org.apache.hc.client5.http.config.RequestConfig.custom()
                    .setConnectionRequestTimeout(Timeout.ofMilliseconds(connectionTimeout))
                    .setResponseTimeout(Timeout.ofMilliseconds(readTimeout))
                    .build())
                .build();

        HttpComponentsClientHttpRequestFactory httpFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
        
        // Use buffering for logging support
        ClientHttpRequestFactory factory = new BufferingClientHttpRequestFactory(httpFactory);
        RestTemplate restTemplate = new RestTemplate(factory);
        
        // Add logging interceptor
        restTemplate.getInterceptors().add((request, body, execution) -> {
            if (logger.isDebugEnabled()) {
                logger.debug("Request URI: {}", request.getURI());
                logger.debug("Request Method: {}", request.getMethod());
                logger.debug("Request Headers: {}", request.getHeaders());
            }
            return execution.execute(request, body);
        });
        
        return restTemplate;
    }
    
    // mapping
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Disable this generic CORS configuration since we're using the one in SecurityConfig
        // This avoids conflicting CORS configurations
        /* 
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
        */
    }
}
