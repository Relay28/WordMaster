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
import java.util.Arrays;
import java.util.stream.Collectors;

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
     * Check if text contains variations of word bank words (tense, plural, etc.)
     */
    public List<String> detectWordBankUsage(String text, List<String> wordBankWords) {
        Map<String, Object> request = new HashMap<>();
        request.put("task", "word_bank_detection");
        request.put("text", text);
        request.put("wordBank", wordBankWords);
        
        AIResponse response = callAIModel(request);
        String result = response.getResult();
        
        // Parse the response - expect comma-separated list of detected words
        if (result == null || result.trim().isEmpty() || result.equalsIgnoreCase("none")) {
            return Collections.emptyList();
        }
        
        return Arrays.stream(result.split(","))
            .map(String::trim)
            .filter(word -> !word.isEmpty())
            .collect(Collectors.toList());
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
                  // Task-specific fallbacks with supportive tone for Filipino students
                String task = (String) request.get("task");
                switch (task) {
                    case "story_prompt":
                        errorResponse.setResult("Let's continue our English conversation! Please share your thoughts in English about the topic.");
                        break;
                    case "role_prompt":
                        errorResponse.setResult("Remember to stay in character and use English vocabulary. You're doing great in practicing English!");
                        break;
                    case "role_check":
                        errorResponse.setResult("APPROPRIATE. Your English is improving! Keep practicing with confidence.");
                        break;
                    case "word_generation":
                        errorResponse.setResult("practice");
                        break;
                    case "grammar_check":
                        errorResponse.setResult("MINOR ERRORS - Your English is getting better! Keep practicing your sentence structure and you'll improve even more.");
                        break;
                    case "language_validation":
                        errorResponse.setResult("ENGLISH - Great job using English! Keep up the excellent work.");
                        break;
                    case "role_generation":
                        errorResponse.setResult("- Discussion Leader\n- Researcher\n- Note Taker\n- Presenter\n- Facilitator");
                        break;
                    default:
                        errorResponse.setResult("Please continue practicing in English. You're making wonderful progress!");
                }
                
                return errorResponse;
            }
        }

        // Update the buildPromptFromRequest method to add English enforcement and supportive tone
        private String buildPromptFromRequest(Map<String, Object> request) {
            String task = (String) request.get("task");
            
            switch (task) {
                case "grammar_check":
                    return "You are a supportive and encouraging English teacher helping Grade 8-9 Filipino students learn English.\n" +
                        "Check the following text: \"" + request.get("text") + "\"\n\n" +
                        "IMPORTANT: First verify that the text is written in ENGLISH. If the text contains Filipino/Tagalog words or is not in English, respond with 'MAJOR ERRORS - Please write in English only. I believe you can do it!'\n\n" +
                        "If the text is in English, evaluate it with kindness and classify it as one of:\n" +
                        "- 'NO ERRORS' if the message is clear and understandable with good English grammar (minor typos are okay)\n" +
                        "- 'MINOR ERRORS' if there are small English grammar issues but the meaning is clear\n" +
                        "- 'MAJOR ERRORS' if there are significant English grammar problems that affect understanding\n\n" +
                        "Remember, you're nurturing young Filipino learners who are building confidence in English. Be encouraging and focus on their progress!\n" +
                        "Start your response with one of these classifications, then provide brief, positive feedback that motivates them to keep improving their English.";

                case "role_check":
                    return "You are a kind and supportive English teacher helping Grade 8-9 Filipino students practice English through role-play.\n" +
                        "Role: " + request.getOrDefault("role", "student") + "\n" +
                        "Context: " + request.getOrDefault("context", "general topics") + "\n" +
                        "Message: \"" + request.getOrDefault("text", "") + "\"\n\n" +
                        "CRITICAL: First check if the message is written in ENGLISH. If it contains Filipino/Tagalog or is not in English, respond with 'NOT APPROPRIATE - Please use English only. You're doing great - just remember to practice in English!'\n\n" +
                        "If the message is in English, analyze if the vocabulary, tone, and content match what would be expected from someone in this role.\n" +
                        "YOUR RESPONSE MUST BEGIN EXACTLY with either 'APPROPRIATE' or 'NOT APPROPRIATE' (in capital letters),\n" +
                        "followed by encouraging feedback. Remember, these are young Filipino learners building English confidence - be nurturing and supportive!";

                case "story_prompt":
                    StringBuilder prompt = new StringBuilder("You are a warm and encouraging English teacher creating conversation starters for Grade 8-9 Filipino students practicing ENGLISH.\n");
                    prompt.append("Create a natural, engaging prompt IN ENGLISH that will motivate young Filipino learners to respond in English.\n\n");
                    prompt.append("Topic/Context: ").append(request.get("content")).append("\n");
                    prompt.append("Story progression stage: ").append(request.get("turn")).append("\n");
                    
                    // Focus on story development rather than used words
                    prompt.append("\nIMPORTANT GUIDELINES:\n");
                    prompt.append("- Create a story prompt that builds on the given topic/context\n");
                    prompt.append("- Focus on advancing the narrative or introducing new story elements\n");
                    prompt.append("- Your response must be in ENGLISH and encourage students to respond in ENGLISH\n");
                    prompt.append("- Be warm, supportive, and encouraging - these are young Filipino learners\n");
                    prompt.append("- Create scenarios that naturally require different vocabulary\n");
                    prompt.append("- Progress the story in interesting directions to maintain engagement\n");
                    prompt.append("- Don't reference specific words used by students - focus on story continuity\n");
                    prompt.append("- Include phrases like 'Please respond in English' or 'Let's continue our English story by...'\n");
                    prompt.append("- Keep it conversational and age-appropriate for Grade 8-9 students\n");
                    prompt.append("- Show enthusiasm for their English learning journey\n");
                    
                    return prompt.toString();

                case "word_generation":
                    return "Generate one vocabulary word appropriate for Grade 8-9 Filipino students learning English at " 
                        + request.get("difficulty") + " difficulty level in the context: " 
                        + request.get("context") + ". Choose words that will help them build confidence in English. Reply with just the English word itself.";
                case "word_enrichment":
                    return "You are a helpful English language assistant. For the following word: \"" + request.get("word") + "\", " +
                        "provide a clear, concise definition and an example sentence showing how to use it properly. " +
                        "Format your response exactly as: \"Definition of the word | Example: A sentence using the word.\" " +
                        "Keep the definition brief and suitable for Grade 8-9 English language learners.";
                case "content_generation":
                    // Get the requested number of roles (default to 5 if not specified)
                    int roleCount = 5;
                    if (request.containsKey("roleCount")) {
                        roleCount = ((Number) request.get("roleCount")).intValue();
                    }
                    
                    return "Generate exactly 20 ENGLISH vocabulary words and exactly " + roleCount + " role names for Grade 8-9 Filipino students learning English about: " 
                        + request.get("topic") + ".\n\n"
                        + "IMPORTANT GUIDELINES FOR FILIPINO LEARNERS:\n"
                        + "- All words must be common ENGLISH vocabulary that builds confidence\n"
                        + "- Choose simple, practical ENGLISH words appropriate for Grade 8-9 Filipino students\n"
                        + "- Select words they can use in real English conversations\n"
                        + "- Avoid words that might be too challenging or intimidating\n"
                        + "- Focus on vocabulary that helps them feel successful in English\n\n"
                        + "Create a warm, encouraging scenario description (2-3 sentences) IN ENGLISH that motivates Filipino students to practice English.\n\n"
                        + "You MUST format your response EXACTLY as follows:\n\n"
                        + "DESCRIPTION:\n"
                        + "Your encouraging 2-3 sentence description IN ENGLISH that motivates Grade 8-9 Filipino students to practice English confidently.\n\n"
                        + "WORDS:\n"
                        + "- word1 | Simple English definition | Natural English example sentence\n"
                        + "- word2 | Simple English definition | Natural English example sentence\n"
                        + "- word3 | Simple English definition | Natural English example sentence\n"
                        + "- word4 | Simple English definition | Natural English example sentence\n"
                        + "- word5 | Simple English definition | Natural English example sentence\n"
                        + "- word6 | Simple English definition | Natural English example sentence\n"
                        + "- word7 | Simple English definition | Natural English example sentence\n"
                        + "- word8 | Simple English definition | Natural English example sentence\n"
                        + "- word9 | Simple English definition | Natural English example sentence\n"
                        + "- word10 | Simple English definition | Natural English example sentence\n"
                        + "- word11 | Simple English definition | Natural English example sentence\n"
                        + "- word12 | Simple English definition | Natural English example sentence\n"
                        + "- word13 | Simple English definition | Natural English example sentence\n"
                        + "- word14 | Simple English definition | Natural English example sentence\n"
                        + "- word15 | Simple English definition | Natural English example sentence\n"
                        + "- word16 | Simple English definition | Natural English example sentence\n"
                        + "- word17 | Simple English definition | Natural English example sentence\n"
                        + "- word18 | Simple English definition | Natural English example sentence\n"
                        + "- word19 | Simple English definition | Natural English example sentence\n"
                        + "- word20 | Simple English definition | Natural English example sentence\n\n"
                        + "ROLES:\n" + buildRoleBulletPoints(roleCount) + "\n\n";

                case "generate_feedback":
                    StringBuilder feedbackPrompt = new StringBuilder();
                    feedbackPrompt.append("You are a warm, supportive English teacher providing feedback to a Grade 8-9 Filipino student after an English language learning game.\n\n");
                    
                    String studentName = (String)request.get("studentName");
                    feedbackPrompt.append("Student name: ").append(studentName).append("\n");
                    feedbackPrompt.append("Student role in English practice: ").append(request.get("role")).append("\n");
                    feedbackPrompt.append("Performance metrics:\n");
                    feedbackPrompt.append("- Total score: ").append(request.get("totalScore")).append("\n");
                    feedbackPrompt.append("- English messages sent: ").append(request.get("messageCount")).append("\n");
                    feedbackPrompt.append("- Perfect English grammar messages: ").append(request.get("perfectGrammarCount")).append("\n");
                    feedbackPrompt.append("- English word bank usage: ").append(request.get("wordBankUsageCount")).append("\n\n");
                    
                    feedbackPrompt.append("Sample English messages from student:\n");
                    List<String> sampleMessages = (List<String>) request.get("sampleMessages");
                    for (int i = 0; i < sampleMessages.size(); i++) {
                        feedbackPrompt.append(i+1).append(". ").append(sampleMessages.get(i)).append("\n");
                    }
                    
                    feedbackPrompt.append("\nProvide nurturing, encouraging feedback for this young Filipino learner addressing:\n");
                    feedbackPrompt.append("1. English language progress (grammar, vocabulary)\n");
                    feedbackPrompt.append("2. Confidence building in English communication\n");
                    feedbackPrompt.append("3. Participation and effort in English practice\n");
                    feedbackPrompt.append("4. Celebrating strengths and gentle guidance for improvement\n\n");
                    
                    feedbackPrompt.append("IMPORTANT INSTRUCTIONS:\n");
                    feedbackPrompt.append("- Address ").append(studentName).append(" warmly and personally\n");
                    feedbackPrompt.append("- Write like a caring teacher who believes in their English learning journey\n");
                    feedbackPrompt.append("- Emphasize the importance and value of practicing English\n");
                    feedbackPrompt.append("- Be encouraging about their progress as Filipino learners of English\n");
                    feedbackPrompt.append("- Include specific scores (1-5) for:\n");
                    feedbackPrompt.append("  * English Comprehension Score: (1-5)\n");
                    feedbackPrompt.append("  * English Participation Score: (1-5)\n");
                    feedbackPrompt.append("  * English Language Use Score: (1-5)\n");
                    feedbackPrompt.append("  * Role Adherence in English Score: (1-5)\n");
                    feedbackPrompt.append("  * Overall Letter Grade: (A-F)\n\n");
                    
                    feedbackPrompt.append("Format: Start with warm praise, acknowledge their English learning effort, provide gentle guidance, end with motivation to continue improving their English, then list scores.\n");
                    
                    return feedbackPrompt.toString();
                    
                case "word_bank_detection":
                    StringBuilder detectionPrompt = new StringBuilder();
                    detectionPrompt.append("You are helping Grade 8-9 Filipino students learning English detect word bank usage.\n\n");
                    detectionPrompt.append("Text to analyze: \"").append(request.get("text")).append("\"\n");
                    detectionPrompt.append("Word bank words: ").append(request.get("wordBank")).append("\n\n");
                    detectionPrompt.append("TASK: Identify which word bank words (or their variations) appear in the text.\n\n");
                    detectionPrompt.append("RULES FOR DETECTION:\n");
                    detectionPrompt.append("- Match exact forms: 'run' matches 'run'\n");
                    detectionPrompt.append("- Match tense variations: 'run' matches 'ran', 'running', 'runs'\n");
                    detectionPrompt.append("- Match plural/singular: 'book' matches 'books', 'child' matches 'children'\n");
                    detectionPrompt.append("- Match common word forms: 'happy' matches 'happiness', 'happily'\n");
                    detectionPrompt.append("- Only match if the meaning is clearly related\n");
                    detectionPrompt.append("- Be encouraging - these are young English learners\n\n");
                    detectionPrompt.append("RESPONSE FORMAT:\n");
                    detectionPrompt.append("- If words found: Return comma-separated list of the BASE word bank words that were used\n");
                    detectionPrompt.append("- If no words found: Return 'none'\n");
                    detectionPrompt.append("- Example: If text contains 'running' and word bank has 'run', return 'run'\n");
                    detectionPrompt.append("- Example: If text contains 'books' and word bank has 'book', return 'book'\n\n");
                    detectionPrompt.append("Remember: Return the original word bank word, not the variation found in text.");
                    return detectionPrompt.toString();

                case "generate_comprehension_questions":
                    StringBuilder questionsPrompt = new StringBuilder();
                    questionsPrompt.append("You are a supportive English teacher creating comprehension questions for Grade 8-9 Filipino students to assess their English understanding.\n\n");
                    
                    questionsPrompt.append("CRITICAL AND ABSOLUTE REQUIREMENTS:\n");
                    questionsPrompt.append("1. Create exactly 5 multiple choice questions with 4 options each\n");
                    questionsPrompt.append("2. Questions MUST be about general topics from the session, NOT specific player interactions\n");
                    questionsPrompt.append("3. Questions MUST be answerable by ANYONE who participated in the session\n");
                    questionsPrompt.append("4. NEVER reference specific student names, conversations, or individual contributions\n");
                    questionsPrompt.append("5. Focus ONLY on the overall session topic and themes\n\n");
                    
                    questionsPrompt.append("Generate 5 questions based on this OVERALL session content:\n\n");
                    questionsPrompt.append("SESSION TOPIC: ").append(request.get("sessionTopic")).append("\n");
                    questionsPrompt.append("SESSION DESCRIPTION: ").append(request.get("sessionDescription")).append("\n\n");
                    questionsPrompt.append("COLLABORATIVE STORY CONTENT:\n").append(request.get("context")).append("\n\n");
                    
                    questionsPrompt.append("Questions should test understanding of:\n");
                    questionsPrompt.append("1. The main session topic and learning objectives\n");
                    questionsPrompt.append("2. Key vocabulary from the session content\n");
                    questionsPrompt.append("3. Overall themes and concepts\n");
                    questionsPrompt.append("4. English language concepts practiced\n");
                    questionsPrompt.append("5. General comprehension of educational content\n\n");
                    
                    questionsPrompt.append("Format each question EXACTLY as follows:\n");
                    questionsPrompt.append("1. General question about the session topic?\n");
                    questionsPrompt.append("A. Option 1\n");
                    questionsPrompt.append("B. Option 2\n");
                    questionsPrompt.append("C. Option 3\n");
                    questionsPrompt.append("D. Option 4\n");
                    questionsPrompt.append("Correct Answer: B\n\n");
                    
                    return questionsPrompt.toString();

                case "vocabulary_check":
                    String studentName2 = (String) request.get("studentName");
                    return "Analyze this Grade 8-9 Filipino student's English vocabulary usage:\n\n" +
                        (studentName2 != null && !studentName2.trim().isEmpty() ? "Student: " + studentName2 + "\n" : "") +
                        "Text: \"" + request.get("text") + "\"\n" +
                        "Word bank words used: " + request.get("usedWords") + "\n\n" +
                        "Provide a specific analysis of the actual vocabulary used. Include exact words and examples from their text. Format as:\n\n" +
                        "1. VOCABULARY LEVEL: (Basic/Intermediate/Advanced)\n\n" +
                        "2. STRENGTHS:\n" +
                        "   2.1. 'First strength' - Include specific words/examples from their text\n" +
                        "   2.2. 'Second strength' - Include specific words/examples from their text\n" +
                        "   2.3. 'Third strength'' - Include specific words/examples from their text\n\n" +
                        "3. AREAS FOR IMPROVEMENT:\n" +
                        "   3.1. 'First area' - Be specific about what's missing/could improve\n" +
                        "   3.2. 'Second area'- Be specific about what's missing/could improve\n" +
                        "   3.3. 'Third area' - Be specific about what's missing/could improve\n\n" +
                        "4. TEACHING RECOMMENDATIONS:\n" +
                        "   4.1. 'Specific activity' for this student based on their actual text\n" +
                        "   4.2. 'pecific activity' for this student based on their actual text\n" +
                        "   4.3. 'Specific activity' for this student based on their actual text\n" +
                        "   4.4. 'Specific activity' for this student based on their actual text\n\n" +
                        "Keep your analysis focused on their actual vocabulary usage. Max 150 words.";

                case "generate_vocabulary_exercises":
                    StringBuilder exercisesPrompt = new StringBuilder();
                    exercisesPrompt.append("You are a caring and supportive English teacher creating vocabulary exercises for Grade 8-9 Filipino students learning English.\n\n");
                    
                    exercisesPrompt.append("Word bank: ").append(request.get("wordBank")).append("\n\n");
                    exercisesPrompt.append("Words already used by student: ").append(request.get("usedWords")).append("\n\n");
                    exercisesPrompt.append("Student name: ").append(request.get("studentName")).append("\n\n");
                    
                    exercisesPrompt.append("Create 3 encouraging ENGLISH vocabulary exercises that build confidence:\n");
                    exercisesPrompt.append("1. A fill-in-the-blank exercise using ENGLISH words\n");
                    exercisesPrompt.append("2. A word matching exercise with ENGLISH vocabulary\n");
                    exercisesPrompt.append("3. A sentence completion exercise in ENGLISH\n\n");
                    exercisesPrompt.append("Focus on English words the student hasn't used yet to expand their vocabulary.\n");
                    exercisesPrompt.append("Make exercises encouraging and age-appropriate for Filipino learners.\n");
                    exercisesPrompt.append("Format as JSON for easy parsing, ensuring all content promotes English learning.");
                    
                    return exercisesPrompt.toString();
                    
                // Add language validation for Filipino students
                case "language_validation":
                    return "You are helping Grade 8-9 Filipino students practice ENGLISH communication.\n" +
                        "Text to check: \"" + request.get("text") + "\"\n\n" +
                        "Check if this text is written in ENGLISH (not Filipino/Tagalog).\n" +
                        "Respond with either:\n" +
                        "- 'ENGLISH' if the text is primarily in English\n" +
                        "- 'NOT ENGLISH' if the text contains Filipino/Tagalog words or is in another language\n\n" +
                        "Be encouraging - these are young learners building English confidence!";

                case "role_generation":
                    int newRoleCount = ((Number) request.get("roleCount")).intValue();
                    return "Generate " + newRoleCount + " unique role names for a language learning game about: " 
                        + request.get("topic") + ".\n\n"
                        + "Each role should be appropriate for students playing in a conversation scenario. Be creative and diverse.\n"
                        + "Format your response as a bullet point list with exactly " + newRoleCount + " roles:\n"
                        + buildRoleBulletPoints(newRoleCount) + "\n";
                
                default:
                    return "Please provide your response in ENGLISH to help practice your English skills. You're doing great!";
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
