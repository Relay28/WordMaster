package cit.edu.wrdmstr.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Basic unit tests to validate ultra-fast role_check heuristics.
 * (Network path is not invoked for simple English / Tagalog cases.)
 */
public class AIServiceLatencyTests {

    private static class NoOpPerf extends PerformanceMetricsService {
        public NoOpPerf(AIService ai) { super(ai); }
        @Override public void recordRoleCheck(long ms) { /* no-op for test */ }
    }

    private AIService newService() {
        RestTemplate rt = new RestTemplate();
        AIService svc = new AIService(rt, new NoOpPerf(null));
        return svc;
    }

    @Test
    void fastEnglishShortCircuit() {
        AIService svc = newService();
        Map<String,Object> req = new HashMap<>();
        req.put("task","role_check");
        req.put("text","I am ready to learn today.");
        long t0 = System.currentTimeMillis();
        AIService.AIResponse resp = svc.callAIModel(req);
        long elapsed = System.currentTimeMillis()-t0;
        Assertions.assertTrue(elapsed < 50, "Heuristic path should be <50ms but was "+elapsed);
        Assertions.assertTrue(resp.getResult().startsWith("APPROPRIATE"));
    }

    @Test
    void tagalogDetectionShortCircuit() {
        AIService svc = newService();
        Map<String,Object> req = new HashMap<>();
        req.put("task","role_check");
        req.put("text","Magandang umaga ako ay handa");
        AIService.AIResponse resp = svc.callAIModel(req);
        Assertions.assertTrue(resp.getResult().startsWith("NOT APPROPRIATE"));
    }

    @Test
    void cacheHitPath() {
        AIService svc = newService();
        Map<String,Object> req = new HashMap<>();
        req.put("task","role_check");
        req.put("role","student");
        req.put("context","test");
        req.put("text","Hello everyone");
        AIService.AIResponse first = svc.callAIModel(req);
        long t0 = System.currentTimeMillis();
        AIService.AIResponse second = svc.callAIModel(req);
        long elapsed = System.currentTimeMillis()-t0;
        Assertions.assertTrue(elapsed < 10, "Cache hit should return immediately");
        Assertions.assertEquals(first.getResult(), second.getResult());
    }
}
