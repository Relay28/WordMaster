package cit.edu.wrdmstr.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        Hibernate5JakartaModule hibernate5Module = new Hibernate5JakartaModule();
        
        // Configure Hibernate module for handling lazy loading
        hibernate5Module.configure(Hibernate5JakartaModule.Feature.FORCE_LAZY_LOADING, false);
        hibernate5Module.configure(Hibernate5JakartaModule.Feature.USE_TRANSIENT_ANNOTATION, false);
        
        objectMapper.registerModule(hibernate5Module);
        return objectMapper;
    }
}