package cit.edu.wrdmstr.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private final RestTemplate restTemplate;


    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    public AIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Get enhanced grammar feedback from AI model
     */
    public String getGrammarFeedback(String text) {
        Map<String, Object> request = new HashMap<>();
        request.put("text", text);
        request.put("task", "grammar_check");

        AIResponse response = callAIModel(request);
        return response.getResult();
    }

    /**
     * Generate word bombs based on difficulty level and context
     */
    public String generateWordBomb(String difficulty, String context) {
        Map<String, Object> request = new HashMap<>();
        request.put("difficulty", difficulty);
        request.put("context", context);
        request.put("task", "word_generation");

        AIResponse response = callAIModel(request);
        return response.getResult();
    }

    /**
     * Generate story prompts for game turns
     */
    public String generateStoryPrompt(String contextDescription, int turnNumber, List<String> usedWords) {
        Map<String, Object> request = new HashMap<>();
        request.put("content", contextDescription);
        request.put("turn", turnNumber);
        request.put("usedWords", usedWords != null ? usedWords : Collections.emptyList());
        request.put("task", "story_prompt");

        AIResponse response = callAIModel(request);
        return response.getResult();
    }

    /**
     * Call the AI API with the given request
     */
        public AIResponse callAIModel(Map<String, Object> request) {
            // Format for Gemini API
            Map<String, Object> content = new HashMap<>();
            
            String prompt = buildPromptFromRequest(request);
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(textPart);
            content.put("parts", parts);
            
            Map<String, Object> geminiRequest = new HashMap<>();
            geminiRequest.put("contents", Collections.singletonList(content));
            
            // Add API key as query parameter
            String fullUrl = apiUrl + "?key=" + apiKey;
            
            logger.info("Making API request to: {}", apiUrl);
            
            try {
                // Make the API call
                Map response = restTemplate.postForObject(fullUrl, geminiRequest, Map.class);
                
                // Parse Gemini response
                AIResponse result = new AIResponse();
                if (response != null) {
                    // Debug logging
                    logger.debug("Received response: {}", response);
                    
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> candidate = candidates.get(0);
                        Map<String, Object> candidateContent = (Map<String, Object>) candidate.get("content");
                        List<Map<String, Object>> candidateParts = (List<Map<String, Object>>) candidateContent.get("parts");
                        if (candidateParts != null && !candidateParts.isEmpty()) {
                            result.setResult((String) candidateParts.get(0).get("text"));
                        }
                    }
                }
                return result;
            } catch (Exception e) {
                // Handle errors
                logger.error("Error calling Gemini API: " + e.getMessage(), e);
                // Create a fallback response
                AIResponse errorResponse = new AIResponse();
                
                // Task-specific fallbacks
                String task = (String) request.get("task");
                switch (task) {
                    case "story_prompt":
                        errorResponse.setResult("Continue the conversation based on your role and the topic!");
                        break;
                    case "role_prompt":
                        errorResponse.setResult("Remember to stay in character and use vocabulary appropriate for your role.");
                        break;
                    case "word_generation":
                        errorResponse.setResult("vocabulary");
                        break;
                    default:
                        errorResponse.setResult("Error: Unable to get AI response.");
                }
                
                return errorResponse;
            }
        }

        // Update the buildPromptFromRequest method to add a case for story_prompt
        private String buildPromptFromRequest(Map<String, Object> request) {
            String task = (String) request.get("task");
            
            switch (task) {
                case "grammar_check":
                    return "Check the following text for grammar errors and provide feedback. Include phrases 'no errors', 'minor errors', or 'major errors' in your response: " 
                        + request.get("text");
                case "word_generation":
                    return "Generate one challenging vocabulary word appropriate for a " 
                        + request.get("difficulty") + " difficulty level in the context: " 
                        + request.get("context") + ". Reply with just the word itself.";
                case "content_generation":
            return "Generate exactly 10 vocabulary words and exactly 4 role names for a language learning game about: " 
                + request.get("topic") + ".\n\n"
                + "You MUST format your response EXACTLY as follows (including the exact headers and bullet points):\n\n"
                + "WORDS:\n- word1\n- word2\n- word3\n- word4\n- word5\n- word6\n- word7\n- word8\n- word9\n- word10\n\n"
                + "ROLES:\n- role1\n- role2\n- role3\n- role4\n\n"
                + "Replace the placeholders with actual words and roles relevant to the topic. Do not include any other text or explanations.";
                case "story_prompt":
                    StringBuilder prompt = new StringBuilder("Generate a short, engaging scenario prompt for a language learning game. ");
                    prompt.append("Context: ").append(request.get("content")).append(". ");
                    prompt.append("This is turn #").append(request.get("turn")).append(". ");
                    
                    List<String> usedWords = (List<String>) request.get("usedWords");
                    if (usedWords != null && !usedWords.isEmpty()) {
                        prompt.append("Words already used: ").append(String.join(", ", usedWords)).append(". ");
                    }
                    
                    prompt.append("Create a 1-2 sentence prompt that encourages creative conversation and vocabulary use.");
                    return prompt.toString();
                case "role_prompt":
                    StringBuilder rolePrompt = new StringBuilder("You are a language learning assistant helping a student practice their conversation skills. ");
                    rolePrompt.append("Generate a brief guidance tip (1-2 sentences) for a student playing the role of '").append(request.get("role")).append("' ");
                    rolePrompt.append("in a conversation about: ").append(request.get("context")).append(". ");
                    rolePrompt.append("The tip should help them stay in character and use appropriate vocabulary and expressions for this role. Keep it short and helpful.");
                    return rolePrompt.toString();
                case "role_check":
                    return "Evaluate if the following text is appropriate for someone playing the role of '" + 
                    request.get("role") + "' in a conversation about " + request.get("context") + 
                    ". The text is: \"" + request.get("text") + 
                    "\". Respond with either 'Appropriate' or 'Not appropriate' followed by a brief explanation.";
                default:
                    return "Provide a response to: " + request;
            }
        }

    // Make the inner class public so it's accessible from other packages
    public static class AIResponse {
        private String result;

        public String getResult() {
            return result;
        }

        public void setResult(String result) {
            this.result = result;
        }
    }
}
