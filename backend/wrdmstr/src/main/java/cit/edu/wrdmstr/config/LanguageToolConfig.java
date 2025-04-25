package cit.edu.wrdmstr.config;

import org.languagetool.JLanguageTool;
import org.languagetool.language.AmericanEnglish;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LanguageToolConfig {

    @Bean
    public JLanguageTool languageTool() {
        try {
            return new JLanguageTool(new AmericanEnglish());
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize LanguageTool", e);
        }
    }
}