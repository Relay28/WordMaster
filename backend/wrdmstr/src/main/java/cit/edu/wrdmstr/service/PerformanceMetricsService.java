package cit.edu.wrdmstr.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

@Service
public class PerformanceMetricsService {
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMetricsService.class);

    // No direct dependency injections to avoid circular references

    private final LongAdder roleCheckCount = new LongAdder();
    private final LongAdder roleCheckTotalMs = new LongAdder();
    private final AtomicLong roleCheckMaxMs = new AtomicLong();

    @Value("${ai.latency.logging.enabled:true}")
    private boolean latencyLoggingEnabled;

    public PerformanceMetricsService() {}

    // Called externally by AIService after each role_check
    public void recordRoleCheck(long ms) {
        roleCheckCount.increment();
        roleCheckTotalMs.add(ms);
        roleCheckMaxMs.accumulateAndGet(ms, Math::max);
    }

    @Scheduled(fixedDelayString = "${ai.latency.logging.interval-ms:60000}")
    public void report() {
        if (!latencyLoggingEnabled) return;
        long count = roleCheckCount.sumThenReset();
        long total = roleCheckTotalMs.sumThenReset();
        long max = roleCheckMaxMs.getAndSet(0);
        if (count == 0) return;
        double avg = total / (double) count;
        logger.info("[AI METRICS] role_check count={} avgMs={} maxMs={} windowMs={}"
                , count, String.format("%.1f", avg), max, total);
    }

    // Warm ping every 90s to keep external endpoint & DNS hot
    @Scheduled(fixedDelay = 90000, initialDelay = 15000)
    public void warmPing() {
        try {
            // lightweight warm ping to external AI endpoint if configured
            // (avoid invoking AIService to prevent circular dependency)
            // No-op here or could implement a simple HEAD/GET if endpoint supports.
        } catch (Exception e) {
            logger.debug("Warm ping failed: {}", e.getMessage());
        }
    }
}
