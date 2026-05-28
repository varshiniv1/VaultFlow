package com.vaultflow.gateway.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GroqClient {

    private static final String MODEL = "llama-3.3-70b-versatile";
    private static final String BASE_URL = "https://api.groq.com/openai/v1";

    @Value("${groq.api.key:}")
    private String apiKey;

    private final RestClient restClient;

    public GroqClient() {
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    public String chat(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GROQ_API_KEY not set — AI feature unavailable");
            return null;
        }
        try {
            Map<?, ?> response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of(
                            "model", MODEL,
                            "messages", List.of(
                                    Map.of("role", "system", "content", systemPrompt),
                                    Map.of("role", "user", "content", userMessage)
                            ),
                            "max_tokens", 512,
                            "temperature", 0.7
                    ))
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                List<?> choices = (List<?>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
        }
        return null;
    }
}
