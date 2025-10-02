package cit.edu.wrdmstr.config;

import com.github.benmanes.caffeine.cache.CacheLoader;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.Duration;
import java.util.concurrent.Executor;

/**
 * Performance optimization configuration for GECToR and grammar processing
 */
@Configuration
@EnableCaching
@EnableAsync
public class PerformanceConfig {

    /**
     * Optimized cache manager for all application caches
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        cacheManager.setCacheLoader(new CacheLoader<Object, Object>() {
            @Override
            public Object load(Object key) {
                return null;
            }
        });
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofHours(1))
            .recordStats());
            
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "wordBombs",
            "storyPrompts",
            "grammarCorrections",
            "grammarChecks",
            "roleChecks",
            "aiResponses",
            "vocabularyCache",
            "sessionCache"
        ));

        // Pre-create all application caches
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "wordBombs",
            "storyPrompts",
            "grammarCorrections",
            "grammarChecks",
            "roleChecks",
            "aiResponses",
            "vocabularyCache",
            "sessionCache"
        ));

        return cacheManager;
    }

    /**
     * Async executor for grammar processing
     */
    @Bean("grammarProcessingExecutor")
    public Executor grammarProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3); // Moderate pool for grammar processing
        executor.setMaxPoolSize(6);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("Grammar-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * Fast executor for role checks (smaller pool since it's AI-based and slower)
     */
    @Bean("roleCheckExecutor")
    public Executor roleCheckExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("RoleCheck-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * High-speed executor for background tasks
     */
    @Bean("backgroundTaskExecutor")
    public Executor backgroundTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Background-");
        executor.setWaitForTasksToCompleteOnShutdown(false);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
