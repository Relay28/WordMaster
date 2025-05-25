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
            
            logger.info("Making API request to: {}", apiUrl);              try {
                // Make the API call
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(fullUrl, geminiRequest, Map.class);
                
                // Parse Gemini response
                AIResponse result = new AIResponse();
                if (response != null) {
                    // Debug logging
                    logger.debug("Received response: {}", response);
                    
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> candidate = candidates.get(0);
                        @SuppressWarnings("unchecked")
                        Map<String, Object> candidateContent = (Map<String, Object>) candidate.get("content");
                        
                        if (candidateContent != null) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> candidateParts = (List<Map<String, Object>>) candidateContent.get("parts");
                            if (candidateParts != null && !candidateParts.isEmpty()) {
                                Object textObj = candidateParts.get(0).get("text");
                                result.setResult(textObj != null ? textObj.toString() : "No response text");
                            } else {
                                result.setResult("No content parts in response");
                            }
                        } else {
                            result.setResult("No content in response candidate");
                        }
                    } else {
                        result.setResult("No candidates in response");
                    }
                } else {
                    result.setResult("Null response from API");
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
                    case "role_check":
                        errorResponse.setResult("Appropriate. The text appears to match the role context.");
                        break;
                    case "word_generation":
                        errorResponse.setResult("vocabulary");
                        break;
                    case "grammar_check":
                        errorResponse.setResult("The text has minor errors. Please review your sentence structure and punctuation.");
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
                    return "You are a supportive grade 8 language teacher analyzing a student's sentence for a language learning game.\n" +
                        "Check the following text: \"" + request.get("text") + "\"\n\n" +
                        "Evaluate the text and classify it as one of:\n" +
                        "- 'NO ERRORS' if the message is clear and understandable with good grammar (minor typos are okay)\n" +
                        "- 'MINOR ERRORS' if there are small grammar issues but the meaning is clear\n" +
                        "- 'MAJOR ERRORS' if there are significant grammar problems that affect understanding\n\n" +
                        "Be encouraging! Focus on communication effectiveness rather than perfect grammar.\n" +
                        "Start your response with one of these classifications, then provide brief, positive feedback.";

                case "role_check":
                    return "You are evaluating if a student's message is appropriate for their assigned role in a language learning game.\n" +
                        "Role: " + request.getOrDefault("role", "student") + "\n" +
                        "Context: " + request.getOrDefault("context", "general topics") + "\n" +
                        "Message: \"" + request.getOrDefault("text", "") + "\"\n\n" +
                        "First, analyze if the vocabulary, tone, and content match what would be expected from someone in this role.\n" +
                        "YOUR RESPONSE MUST BEGIN EXACTLY with either 'APPROPRIATE' or 'NOT APPROPRIATE' (in capital letters),\n" +
                        "followed by a brief explanation of your reasoning. Consider both language appropriateness and role alignment.";

                case "story_prompt":
                    StringBuilder prompt = new StringBuilder("You are writing conversation starters for students practicing language skills.\n");
                    prompt.append("Create a natural, casual prompt as if you're a teacher guiding a classroom discussion.\n\n");
                    prompt.append("Topic/Context: ").append(request.get("content")).append("\n");
                    prompt.append("Turn number: ").append(request.get("turn")).append("\n");
                    
                    @SuppressWarnings("unchecked")
                    List<String> usedWords = (List<String>) request.get("usedWords");
                    if (usedWords != null && !usedWords.isEmpty()) {
                        prompt.append("Words already used: ").append(String.join(", ", usedWords)).append("\n");
                        prompt.append("Try to create a scenario that might encourage using new vocabulary.\n");
                    }
                    
                    prompt.append("\nYour response should be conversational and sound natural - like something a real teacher would say.\n");
                    prompt.append("Keep it to 1-2 sentences maximum and don't use academic or AI-sounding language.\n");
                    prompt.append("Don't mention that you're an AI or that this is a language exercise - just write a natural prompt.\n");
                    return prompt.toString();
                    
                case "word_generation":
                    return "Generate one challenging vocabulary word appropriate for a " 
                        + request.get("difficulty") + " difficulty level in the context: " 
                        + request.get("context") + ". Reply with just the word itself.";
        case "content_generation":
            // Get the requested number of roles (default to 5 if not specified)
            int roleCount = 5;
            if (request.containsKey("roleCount")) {
                roleCount = ((Number) request.get("roleCount")).intValue();
            }
            
            return "Generate exactly 20 vocabulary words and exactly " + roleCount + " role names for a language learning game about: " 
                + request.get("topic") + ".\n\n"
                + "IMPORTANT GUIDELINES:\n"
                + "- Choose simple, practical words that students can easily incorporate into conversations\n"
                + "- Avoid technical jargon or overly complex terms\n"
                + "- Select words that naturally fit into a conversation about this topic\n"
                + "- Choose words at approximately middle-school to early high-school level\n\n"
                + "Also create a brief, engaging scenario description (2-3 sentences) that introduces the context and purpose for this language activity.\n\n"
                + "You MUST format your response EXACTLY as follows (including the exact headers and bullet points):\n\n"
                + "DESCRIPTION:\n"
                + "Your engaging 2-3 sentence description here that sets context for the activity and relates to the topic.\n\n"
                + "WORDS:\n"
                + "- word1 | Brief definition of word1 | Example sentence using word1\n"
                + "- word2 | Brief definition of word2 | Example sentence using word2\n"
                + "- word3 | Brief definition of word3 | Example sentence using word3\n"
                + "- word4 | Brief definition of word4 | Example sentence using word4\n"
                + "- word5 | Brief definition of word5 | Example sentence using word5\n"
                + "- word6 | Brief definition of word6 | Example sentence using word6\n"
                + "- word7 | Brief definition of word7 | Example sentence using word7\n"
                + "- word8 | Brief definition of word8 | Example sentence using word8\n"
                + "- word9 | Brief definition of word9 | Example sentence using word9\n"
                + "- word10 | Brief definition of word10 | Example sentence using word10\n"
                + "- word11 | Brief definition of word11 | Example sentence using word11\n"
                + "- word12 | Brief definition of word12 | Example sentence using word12\n"
                + "- word13 | Brief definition of word13 | Example sentence using word13\n"
                + "- word14 | Brief definition of word14 | Example sentence using word14\n"
                + "- word15 | Brief definition of word15 | Example sentence using word15\n"
                + "- word16 | Brief definition of word16 | Example sentence using word16\n"
                + "- word17 | Brief definition of word17 | Example sentence using word17\n"
                + "- word18 | Brief definition of word18 | Example sentence using word18\n"
                + "- word19 | Brief definition of word19 | Example sentence using word19\n"
                + "- word20 | Brief definition of word20 | Example sentence using word20\n\n"
                + "ROLES:\n" + buildRoleBulletPoints(roleCount) + "\n\n";
                case "role_generation":
                    int newRoleCount = ((Number) request.get("roleCount")).intValue();
                    return "Generate " + newRoleCount + " unique role names for a language learning game about: " 
                        + request.get("topic") + ".\n\n"
                        + "Each role should be appropriate for students playing in a conversation scenario. Be creative and diverse.\n"
                        + "Format your response as a bullet point list with exactly " + newRoleCount + " roles:\n"
                        + buildRoleBulletPoints(newRoleCount) + "\n";
                case "generate_feedback":
                    StringBuilder feedbackPrompt = new StringBuilder();
                    feedbackPrompt.append("You are a language teacher providing feedback to a student after a language learning game.\n\n");
                    
                    //Add more emphasis on using student's actual name
                    String studentName = (String)request.get("studentName");
                    feedbackPrompt.append("Student name: ").append(studentName).append("\n");
                    feedbackPrompt.append("Student role in game: ").append(request.get("role")).append("\n");
                    feedbackPrompt.append("Performance metrics:\n");
                    feedbackPrompt.append("- Total score: ").append(request.get("totalScore")).append("\n");
                    feedbackPrompt.append("- Messages sent: ").append(request.get("messageCount")).append("\n");
                    feedbackPrompt.append("- Perfect grammar messages: ").append(request.get("perfectGrammarCount")).append("\n");
                    feedbackPrompt.append("- Word bank usage: ").append(request.get("wordBankUsageCount")).append("\n\n");
                    
                    feedbackPrompt.append("Sample messages from student:\n");
                    List<String> sampleMessages = (List<String>) request.get("sampleMessages");
                    for (int i = 0; i < sampleMessages.size(); i++) {
                        feedbackPrompt.append(i+1).append(". ").append(sampleMessages.get(i)).append("\n");
                    }
                    
                    feedbackPrompt.append("\nProvide constructive feedback addressing:\n");
                    feedbackPrompt.append("1. Language use (grammar, vocabulary)\n");
                    feedbackPrompt.append("2. Role adherence and character consistency\n");
                    feedbackPrompt.append("3. Participation level\n");
                    feedbackPrompt.append("4. Strengths and areas for improvement\n\n");
                    
                    // Add instruction to use student's name and provide scores
                    feedbackPrompt.append("IMPORTANT INSTRUCTIONS:\n");
                    feedbackPrompt.append("- Address the student by name \"" + studentName + "\" directly in your feedback\n");
                    feedbackPrompt.append("- DO NOT use placeholders like [Student Name]\n");
                    feedbackPrompt.append("- Include specific scores (on a scale of 1-5) for each of these areas:\n");
                    feedbackPrompt.append("  * Comprehension Score: (1-5)\n");
                    feedbackPrompt.append("  * Participation Score: (1-5)\n");
                    feedbackPrompt.append("  * Language Use Score: (1-5)\n");
                    feedbackPrompt.append("  * Role Adherence Score: (1-5)\n");
                    feedbackPrompt.append("  * Overall Letter Grade: (A-F)\n\n");
                    
                    feedbackPrompt.append("Format: Start with positive feedback, then areas for improvement, end with encouragement, and finally list all scores.\n");
                    
                    return feedbackPrompt.toString();
                case "generate_comprehension_questions":
                    StringBuilder questionsPrompt = new StringBuilder();
                    questionsPrompt.append("You are an expert language teacher creating a comprehension quiz to assess a student's understanding.\n\n");
                    questionsPrompt.append("Please create 5 questions based on the following context:\n\n");
                    questionsPrompt.append(request.get("context")).append("\n\n");
                    questionsPrompt.append("Student: ").append(request.get("studentName")).append("\n");
                    questionsPrompt.append("Student's Role: ").append(request.get("studentRole")).append("\n\n");
                    
                    questionsPrompt.append("Generate 5 questions with the following format:\n");
                    questionsPrompt.append("1. First multiple choice question?\n");
                    questionsPrompt.append("A. Option 1\n");
                    questionsPrompt.append("B. Option 2\n");
                    questionsPrompt.append("C. Option 3\n");
                    questionsPrompt.append("D. Option 4\n");
                    questionsPrompt.append("Correct Answer: B\n\n");
                    
                    questionsPrompt.append("2. Second true/false question?\n");
                    questionsPrompt.append("A. True\n");
                    questionsPrompt.append("B. False\n");
                    questionsPrompt.append("Correct Answer: A\n\n");
                    
                    questionsPrompt.append("Only create multiple choice and true/false questions. DO NOT create short answer questions.\n");
                    questionsPrompt.append("Each question must have exactly 4 options for multiple choice or 2 options (True/False) for true/false questions.\n");
                    questionsPrompt.append("Make sure questions test comprehension of the content, conversation context, and the student's role.\n");
                    questionsPrompt.append("Include questions about key vocabulary when appropriate.\n");
                    
                    return questionsPrompt.toString();
                case "evaluate_short_answer":
                    StringBuilder evaluationPrompt = new StringBuilder();
                    evaluationPrompt.append("You are evaluating a student's short answer response.\n\n");
                    evaluationPrompt.append("Question: ").append(request.get("question")).append("\n");
                    evaluationPrompt.append("Expected Answer: ").append(request.get("expectedAnswer")).append("\n");
                    evaluationPrompt.append("Student's Answer: ").append(request.get("studentAnswer")).append("\n\n");
                    
                    evaluationPrompt.append("Evaluate if the student's answer demonstrates understanding of the concept.\n");
                    evaluationPrompt.append("Response should start with either CORRECT or INCORRECT, followed by a brief explanation.\n");
                    evaluationPrompt.append("Consider semantic similarity rather than exact wording.\n");
                    
                    return evaluationPrompt.toString();
                case "word_enrichment":
                    return "You're helping create materials for students learning English. For the word: " + 
                        request.get("word") + ":\n\n" +
                        "1. Provide a simple, clear definition that a middle-school student would understand\n" +
                        "2. Write a natural, conversational example sentence showing how this word is used in everyday speech\n\n" +
                        "Make your response useful for language learners by using straightforward language.\n" +
                        "Format your response exactly as follows (no labels):\n" +
                        "[simple definition] | [natural example sentence]";
                case "vocabulary_check":
                    StringBuilder vocabPrompt = new StringBuilder();
                    vocabPrompt.append("You are analyzing vocabulary usage in student text for language learning assessment.\n\n");
                    vocabPrompt.append("Text to analyze: \"").append(request.get("text")).append("\"\n");
                    vocabPrompt.append("Words used from word bank: ").append(request.get("usedWords")).append("\n\n");
                    
                    // Include analysis results if available
                    Map<String, Object> analysis = (Map<String, Object>) request.get("vocabularyAnalysis");
                    if (analysis != null) {
                        vocabPrompt.append("Vocabulary Analysis Results:\n");
                        vocabPrompt.append("- Vocabulary Level: ").append(analysis.get("vocabularyLevel")).append("\n");
                        vocabPrompt.append("- Advanced Words: ").append(analysis.get("advancedWords")).append("\n");
                        vocabPrompt.append("- Lexical Density: ").append(analysis.get("lexicalDensity")).append("\n");
                        vocabPrompt.append("- Type-Token Ratio: ").append(analysis.get("typeTokenRatio")).append("\n\n");
                    }
                    
                    vocabPrompt.append("Provide constructive feedback on:\n");
                    vocabPrompt.append("1. Effective use of vocabulary from the word bank\n");
                    vocabPrompt.append("2. Complexity and sophistication of word choices\n");
                    vocabPrompt.append("3. Suggestions for vocabulary enhancement\n");
                    vocabPrompt.append("4. Recognition of advanced vocabulary usage\n\n");
                    vocabPrompt.append("Keep feedback encouraging and specific to help student improvement.");
                    
                    return vocabPrompt.toString();
                case "generate_vocabulary_exercises":
                    StringBuilder exercisesPrompt = new StringBuilder();
                    exercisesPrompt.append("You are creating vocabulary exercises for a language learning game.\n\n");
                    
                    exercisesPrompt.append("Word bank: ").append(request.get("wordBank")).append("\n\n");
                    exercisesPrompt.append("Words already used by student: ").append(request.get("usedWords")).append("\n\n");
                    exercisesPrompt.append("Student name: ").append(request.get("studentName")).append("\n\n");
                    
                    exercisesPrompt.append("Create 3 vocabulary exercises:\n");
                    exercisesPrompt.append("1. A fill-in-the-blank exercise\n");
                    exercisesPrompt.append("2. A word matching exercise\n");
                    exercisesPrompt.append("3. A sentence completion exercise\n\n");
                    exercisesPrompt.append("Focus on words the student hasn't used yet. Format as JSON for easy parsing.");
                    
                    return exercisesPrompt.toString();
                default:
                    return "Provide a response to: " + request;
            }
        }

        // Helper method to build bullet points for roles
        private String buildRoleBulletPoints(int count) {
        StringBuilder bullets = new StringBuilder();
        for (int i = 1; i <= count; i++) {
            bullets.append("- role").append(i).append("\n");
        }
        return bullets.toString();
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
