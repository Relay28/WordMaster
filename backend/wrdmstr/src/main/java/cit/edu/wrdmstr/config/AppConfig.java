package cit.edu.wrdmstr.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Random;

@Configuration
public class AppConfig implements WebMvcConfigurer {


    @Bean
    public Random random() {
        return new Random();
    }
    @Bean
    public RestTemplate restTemplate() {
        // Use Apache HttpClient with pooling to reduce handshake latency
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setMaxTotal(120);
        cm.setDefaultMaxPerRoute(30);
        cm.closeIdle(TimeValue.ofSeconds(30));

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(cm)
                .evictExpiredConnections()
                .build();

        HttpComponentsClientHttpRequestFactory httpFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
        httpFactory.setConnectTimeout(1500);
        httpFactory.setConnectionRequestTimeout(1000);
        httpFactory.setReadTimeout(2500);

        ClientHttpRequestFactory factory = new BufferingClientHttpRequestFactory(httpFactory);

        RestTemplate restTemplate = new RestTemplate(factory);
        
        // logging 
        restTemplate.getInterceptors().add((request, body, execution) -> {
            System.out.println("Request URI: " + request.getURI());
            System.out.println("Request Method: " + request.getMethod());
            System.out.println("Request Headers: " + request.getHeaders());
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
