package cit.edu.wrdmstr.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // This configuration enables Spring's scheduled task execution
    // Used by GameSessionManagerService for turn timers
}