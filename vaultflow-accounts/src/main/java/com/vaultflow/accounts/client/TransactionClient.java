package com.vaultflow.accounts.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class TransactionClient {

    private final RestClient restClient;

    public TransactionClient(@Value("${services.transactions.url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public void record(UUID sourceAccountId, UUID targetAccountId,
                       String type, BigDecimal amount, String currency, String description) {
        Map<String, Object> body = new HashMap<>();
        body.put("sourceAccountId", sourceAccountId);
        body.put("targetAccountId", targetAccountId);
        body.put("type", type);
        body.put("amount", amount);
        body.put("currency", currency != null ? currency : "USD");
        body.put("description", description);

        try {
            restClient.post()
                    .uri("/api/transactions")
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to record transaction in transactions service: {}", e.getMessage());
        }
    }
}
