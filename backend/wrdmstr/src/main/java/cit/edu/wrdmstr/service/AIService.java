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
import java.util.Random;
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
            int maxRetries = 3;
            int retryDelay = 2000; // 2 seconds
            
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
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
                        if (attempt < maxRetries && e.getMessage().contains("503")) {
                            logger.warn("API overloaded, retrying in {} ms (attempt {}/{})", retryDelay, attempt, maxRetries);
                            try {
                                Thread.sleep(retryDelay);
                                retryDelay *= 2; // Exponential backoff
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                            continue;
                        }
                        
                        // If all retries failed or it's not a 503 error, use fallback
                        logger.error("Error calling Gemini API: " + e.getMessage(), e);
                        // Create a fallback response
                        AIResponse errorResponse = new AIResponse();
                          // Task-specific fallbacks with supportive tone for Filipino students
                        String task = (String) request.get("task");
                        switch (task) {
                            case "story_prompt":
                                // Try to get content information from request for better fallbacks
                                String contentTopic = (String) request.get("content");
                                if (contentTopic != null && !contentTopic.trim().isEmpty()) {
                                    String[] contentAwareFallbacks = {
                                        "The group is discussing " + contentTopic + ". What aspect should they explore next?",
                                        "Everyone is learning about " + contentTopic + ". What question should they ask?",
                                        "The students are working on " + contentTopic + " together. What should they focus on?",
                                        "The team is exploring " + contentTopic + ". What should they investigate next?"
                                    };
                                    errorResponse.setResult(contentAwareFallbacks[new Random().nextInt(contentAwareFallbacks.length)]);
                                } else {
                                    String[] simpleFallbacks = {
                                        "The group is working together on their project. What should they do next?",
                                        "Something interesting is about to happen. How do you think the story should continue?",
                                        "The students are having a good conversation. What topic should they discuss now?",
                                        "Everyone is excited about the next part of the story. What do you suggest happens?"
                                    };
                                    errorResponse.setResult(simpleFallbacks[new Random().nextInt(simpleFallbacks.length)]);
                                }
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
                } catch (Exception e) {
                    // Handle errors
                    logger.error("Error calling Gemini API: " + e.getMessage(), e);
                    // Create a fallback response
                    AIResponse errorResponse = new AIResponse();
                      // Task-specific fallbacks with supportive tone for Filipino students
                    String task = (String) request.get("task");
                    switch (task) {
                        case "story_prompt":
                            // Try to get content information from request for better fallbacks
                            String contentTopic = (String) request.get("content");
                            if (contentTopic != null && !contentTopic.trim().isEmpty()) {
                                String[] contentAwareFallbacks = {
                                    "The group is discussing " + contentTopic + ". What aspect should they explore next?",
                                    "Everyone is learning about " + contentTopic + ". What question should they ask?",
                                    "The students are working on " + contentTopic + " together. What should they focus on?",
                                    "The team is exploring " + contentTopic + ". What should they investigate next?"
                                };
                                errorResponse.setResult(contentAwareFallbacks[new Random().nextInt(contentAwareFallbacks.length)]);
                            } else {
                                String[] simpleFallbacks = {
                                    "The group is working together on their project. What should they do next?",
                                    "Something interesting is about to happen. How do you think the story should continue?",
                                    "The students are having a good conversation. What topic should they discuss now?",
                                    "Everyone is excited about the next part of the story. What do you suggest happens?"
                                };
                                errorResponse.setResult(simpleFallbacks[new Random().nextInt(simpleFallbacks.length)]);
                            }
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
            
            // If all retries fail, return a generic error response
            AIResponse errorResponse = new AIResponse();
            errorResponse.setResult("Error communicating with AI service. Please try again later.");
            return errorResponse;
        }

        // Update the buildPromptFromRequest method to add English enforcement and supportive tone
        private String buildPromptFromRequest(Map<String, Object> request) {
            String task = (String) request.get("task");
            
            switch (task) {
                case "grammar_check":
                    return "You are a supportive English teacher helping Grade 8-9 Filipino students.\n" +
                        "Analyze: \"" + request.get("text") + "\"\n\n" +
                        "Respond with EXACTLY this format:\n" +
                        "[STATUS] - [One encouraging comment]\n" +
                        "✓ [What they did well - be specific]\n" +
                        "💡 [One actionable improvement tip]\n\n" +
                        "STATUS options: NO ERRORS, MINOR ERRORS, MAJOR ERRORS\n" +
                        "Keep total response under 50 words. Focus on the most important feedback only.";

                case "role_check":
                    return "You are helping Grade 8-9 Filipino students practice English through role-play.\n" +
                        "Role: " + request.getOrDefault("role", "student") + "\n" +
                        "Context: " + request.getOrDefault("context", "general topics") + "\n" +
                        "Message: \"" + request.getOrDefault("text", "") + "\"\n\n" +
                        "STEP 1 - Language Check:\n" +
                        "If message contains Filipino/Tagalog words or is not in English, respond: 'NOT APPROPRIATE - Please use English only. You're doing great!'\n\n" +
                        "STEP 2 - Role Appropriateness:\n" +
                        "If message is in English, check if vocabulary, tone, and content fit the assigned role.\n\n" +
                        "RESPONSE FORMAT:\n" +
                        "Start with 'APPROPRIATE' or 'NOT APPROPRIATE' followed by brief encouraging feedback.\n" +
                        "Keep total response under 25 words. Be supportive but concise.";

                case "story_prompt":
                    StringBuilder prompt = new StringBuilder();
                    prompt.append("You are creating simple, engaging story prompts for Grade 8-9 Filipino students learning English.\n\n");
                    
                    prompt.append("CRITICAL REQUIREMENTS:\n");
                    prompt.append("- Write at a Grade 8-9 reading level (simple vocabulary, clear sentences)\n");
                    prompt.append("- Maximum 3-4 sentences total\n");
                    prompt.append("- Use common English words that Filipino students know\n");
                    prompt.append("- NO special formatting (**, ##, Turn X:, etc.)\n");
                    prompt.append("- NO gender assumptions (use 'they/them' or names only)\n");
                    prompt.append("- MUST relate directly to the content topic and roles\n");
                    prompt.append("- End with a simple question or choice for the next player\n\n");
                    
                    // Make content information more prominent
                    prompt.append("CONTENT TOPIC: ").append(request.get("content")).append("\n");
                    prompt.append("CONTENT DESCRIPTION: ").append(request.getOrDefault("contentDescription", "")).append("\n");
                    prompt.append("Current turn: ").append(request.get("turn")).append("\n\n");
                    
                    // Include player roles prominently
                    @SuppressWarnings("unchecked")
                    List<String> playerNames = (List<String>) request.get("playerNames");
                    @SuppressWarnings("unchecked")
                    Map<String, String> playerRoles = (Map<String, String>) request.get("playerRoles");
                    
                    if (playerNames != null && !playerNames.isEmpty()) {
                        prompt.append("STUDENTS AND THEIR ROLES:\n");
                        for (String playerName : playerNames) {
                            String role = playerRoles != null ? playerRoles.get(playerName) : "Student";
                            prompt.append("- ").append(playerName).append(" as ").append(role).append("\n");
                        }
                        prompt.append("\n");
                    }
                    
                    // Include previous story for continuity
                    @SuppressWarnings("unchecked")
                    List<String> previousElements = (List<String>) request.get("previousStory");
                    if (previousElements != null && !previousElements.isEmpty()) {
                        prompt.append("PREVIOUS STORY PARTS:\n");
                        for (int i = Math.max(0, previousElements.size() - 2); i < previousElements.size(); i++) {
                            prompt.append("Part ").append(i + 1).append(": ").append(previousElements.get(i)).append("\n");
                        }
                        prompt.append("\n");
                    }
                    
                    prompt.append("CREATE A STORY PROMPT THAT:\n");
                    prompt.append("- Directly relates to the content topic: ").append(request.get("content")).append("\n");
                    prompt.append("- Incorporates the student roles meaningfully\n");
                    prompt.append("- Uses gender-neutral language (they/them or just names)\n");
                    prompt.append("- Uses simple English vocabulary\n");
                    prompt.append("- Creates a situation where students can use their roles\n");
                    prompt.append("- Continues logically from previous story parts\n");
                    prompt.append("- Ends with a clear question or choice for the next student\n\n");
                    
                    prompt.append("EXAMPLE FORMATS:\n");
                    prompt.append("Topic: Environmental Science, Roles: Researcher, Reporter\n");
                    prompt.append("→ 'The team is studying pollution in the river. Alex the Researcher found some interesting data. Sam the Reporter needs to share this with the community. What should they do next?'\n\n");
                    
                    prompt.append("Topic: History, Roles: Explorer, Guide, Historian\n");
                    prompt.append("→ 'The group arrived at the ancient ruins. Maya the Explorer wants to investigate. Jordan the Guide knows the safe paths. What should the team explore first?'\n\n");
                    
                    prompt.append("Write ONLY the story prompt (no formatting, no extra text):");
                    
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
                    feedbackPrompt.append("5. Discourage Slang and inappropriate english\n\n");
                    
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
                    detectionPrompt.append("TASK: Detect word bank usage in student text.\n\n");
                    detectionPrompt.append("Text: \"").append(request.get("text")).append("\"\n");
                    detectionPrompt.append("Word Bank: ").append(request.get("wordBank")).append("\n\n");
                    
                    detectionPrompt.append("DETECTION RULES (ALL MUST BE APPLIED):\n");
                    detectionPrompt.append("1. Exact matches: 'run' = 'run'\n");
                    detectionPrompt.append("2. Tense variations: 'run' = 'ran', 'running', 'runs'\n");
                    detectionPrompt.append("3. Plural/singular: 'book' = 'books', 'child' = 'children'\n");
                    detectionPrompt.append("4. Word forms: 'happy' = 'happiness', 'happily'\n");
                    detectionPrompt.append("5. Only semantically related words count\n\n");
                    
                    detectionPrompt.append("OUTPUT REQUIREMENTS:\n");
                    detectionPrompt.append("- Found words: Return comma-separated list of BASE word bank words\n");
                    detectionPrompt.append("- No words found: Return 'none'\n");
                    detectionPrompt.append("- Example: Text has 'running', word bank has 'run' → return 'run'\n");
                    detectionPrompt.append("- Example: Text has 'books', word bank has 'book' → return 'book'\n\n");
                    detectionPrompt.append("CRITICAL: Return original word bank words, not text variations.");
                    return detectionPrompt.toString();

                case "comprehension_questions": // Change from "generate_comprehension_questions"
                    StringBuilder questionsPrompt = new StringBuilder();
                    questionsPrompt.append("You are a supportive English teacher creating comprehension questions for Grade 8-9 Filipino students to assess their English understanding.\n\n");
                    
                    questionsPrompt.append("CRITICAL AND ABSOLUTE REQUIREMENTS:\n");
                    questionsPrompt.append("1. Create exactly 5 multiple choice questions with 4 options each\n");
                    questionsPrompt.append("2. Questions MUST be about general topics from the session, NOT specific player interactions\n");
                    questionsPrompt.append("3. Questions MUST be answerable by ANYONE who participated in the session\n");
                    questionsPrompt.append("4. NEVER reference specific student names, conversations, or individual contributions\n");
                    questionsPrompt.append("5. Focus ONLY on the overall session topic and themes\n\n");
                    
                    questionsPrompt.append("Generate 5 questions based on this OVERALL session content:\n\n");
                    questionsPrompt.append(request.get("sessionSummary")).append("\n\n");
                    
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
                    return "Analyze Grade 8-9 Filipino student's English vocabulary usage:\n\n" +
                        (studentName2 != null && !studentName2.trim().isEmpty() ? "Student: " + studentName2 + "\n" : "") +
                        "Text: \"" + request.get("text") + "\"\n" +
                        "Word bank words used: " + request.get("usedWords") + "\n\n" +
                        "REQUIRED ANALYSIS FORMAT:\n\n" +
                        "1. VOCABULARY LEVEL: (Basic/Intermediate/Advanced)\n\n" +
                        "2. STRENGTHS:\n" +
                        "   2.1. [Specific strength with exact words from text]\n" +
                        "   2.2. [Second strength with examples]\n\n" +
                        "3. AREAS FOR IMPROVEMENT:\n" +
                        "   3.1. [Specific gap with concrete suggestion]\n" +
                        "   3.2. [Second area with actionable advice]\n\n" +
                        "4. TEACHING RECOMMENDATIONS:\n" +
                        "   4.1. [Specific activity based on their actual text]\n" +
                        "   4.2. [Second targeted activity]\n\n" +
                        "CONSTRAINTS:\n" +
                        "- Each point: maximum 2 sentences\n" +
                        "- Use exact words/phrases from student text\n" +
                        "- Base recommendations on actual usage patterns\n" +
                        "- Be encouraging but specific";
                    
                case "language_validation":
                    return "You are helping Grade 8-9 Filipino students practice ENGLISH communication.\n" +
                        "Text to check: \"" + request.get("text") + "\"\n\n" +
                        "Check if this text is written in ENGLISH (not Filipino/Tagalog).\n" +
                        "Respond with either:\n" +
                        "- 'ENGLISH' if the text is primarily in English\n" +
                        "- 'NOT ENGLISH' if the text contains Filipino words or is in another language\n\n" +
                        "Be encouraging - these are young learners building English confidence!";

                case "role_generation":
                    int newRoleCount = ((Number) request.get("roleCount")).intValue();
                    return "Generate " + newRoleCount + " simple role names for Grade 8-9 Filipino students learning English about: " 
                        + request.get("topic") + ".\n\n"
                        + "IMPORTANT GUIDELINES:\n"
                        + "- Each role should be a simple, clear name (1-2 words maximum)\n"
                        + "- Roles should be appropriate for students in conversation scenarios\n"
                        + "- Use simple English that Grade 8-9 Filipino students can understand\n"
                        + "- Be creative but keep names concise\n"
                        + "- Roles should also be relevant to the Description\n"
                        + "- Examples: Speaker, Listener, Moderator, Researcher, etc.\n\n"
                        + "Format your response as a bullet point list with exactly " + newRoleCount + " simple role names:\n"
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

    /**
     * Clean and validate story prompts for Grade 8-9 students
     */
    private String cleanStoryPrompt(String rawStory) {
        if (rawStory == null || rawStory.trim().isEmpty()) {
            return "Let's continue our story! What happens next?";
        }
        
        String cleaned = rawStory.trim();
        
        // Remove markdown formatting
        cleaned = cleaned.replaceAll("\\*\\*([^*]+)\\*\\*", "$1"); // Remove **bold**
        cleaned = cleaned.replaceAll("\\*([^*]+)\\*", "$1"); // Remove *italic*
        cleaned = cleaned.replaceAll("#{1,6}\\s*", ""); // Remove headers
        cleaned = cleaned.replaceAll("Turn \\d+:", ""); // Remove "Turn X:"
        cleaned = cleaned.replaceAll("\\(([^)]+)\\)", ""); // Remove parenthetical directions
        
        // Remove complex punctuation
        cleaned = cleaned.replaceAll("[\u201C\u201D\u2018\u2019\u201E\u201A]", "\""); // Normalize quotes
        cleaned = cleaned.replaceAll("…", "..."); // Normalize ellipsis
        
        // Split into sentences and limit length
        String[] sentences = cleaned.split("\\. ");
        StringBuilder result = new StringBuilder();
        int sentenceCount = 0;
        
        for (String sentence : sentences) {
            if (sentenceCount >= 4) break; // Max 4 sentences
            
            sentence = sentence.trim();
            if (!sentence.isEmpty()) {
                // Skip overly complex sentences (>20 words)
                String[] words = sentence.split("\\s+");
                if (words.length <= 20) {
                    if (result.length() > 0) result.append(". ");
                    result.append(sentence);
                    sentenceCount++;
                }
            }
        }
        
        String finalStory = result.toString().trim();
        
        // Ensure it ends with proper punctuation
        if (!finalStory.endsWith(".") && !finalStory.endsWith("?") && !finalStory.endsWith("!")) {
            finalStory += ".";
        }
        
        // If still too long, provide a simple fallback
        if (finalStory.length() > 300) {
            return "The story continues. What do you think should happen next? Share your ideas!";
        }
        
        return finalStory;
    }
}
