package com.vaultflow.gateway.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GroqClient {

    private static final String MODEL   = "llama-3.3-70b-versatile";
    private static final String BASE_URL = "https://api.groq.com/openai/v1";

    @Value("${groq.api.key:}")
    private String apiKey;

    private final RestClient restClient;

    public GroqClient() {
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    /**
     * Single-turn convenience (kept for other callers).
     */
    public String chat(String systemPrompt, String userMessage) {
        return chatWithHistory(systemPrompt, null, userMessage);
    }

    /**
     * Multi-turn chat with full conversation history.
     *
     * @param systemPrompt the system context (includes live account data)
     * @param history      previous turns [{role, content}, ...] — may be null or empty
     * @param userMessage  the latest user message
     * @return assistant reply, or null if the API key is not configured
     */
    public String chatWithHistory(String systemPrompt,
                                   List<Map<String, String>> history,
                                   String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GROQ_API_KEY not set — AI feature unavailable");
            return null;
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (history != null) {
            // Keep last 10 turns to stay within context limits
            int start = Math.max(0, history.size() - 10);
            messages.addAll(history.subList(start, history.size()));
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        try {
            Map<?, ?> response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of(
                            "model",       MODEL,
                            "messages",    messages,
                            "max_tokens",  512,
                            "temperature", 0.7
                    ))
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                List<?> choices = (List<?>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<?, ?> msg = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                    return (String) msg.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
        }
        return null;
    }
}
