package com.vaultflow.accounts.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Records a transaction in the transactions service.
 *
 * Protected by Resilience4j:
 *  - @Retry         — up to 3 attempts with 500 ms back-off on connection errors
 *  - @CircuitBreaker — trips open after 50% failures; fallback logs a warning and continues
 *
 * Transactions are best-effort: a failure here must never prevent the account
 * balance from being updated (the source of truth lives in accounts-db).
 */
@Slf4j
@Component
public class TransactionClient {

    private final RestClient restClient;

    public TransactionClient(@Value("${services.transactions.url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Retry(name = "transactions")
    @CircuitBreaker(name = "transactions", fallbackMethod = "recordFallback")
    public void record(UUID sourceAccountId, UUID targetAccountId,
                       String type, BigDecimal amount, String currency,
                       String description, String category) {

        Map<String, Object> body = new HashMap<>();
        body.put("sourceAccountId", sourceAccountId);
        body.put("targetAccountId", targetAccountId);
        body.put("type", type);
        body.put("amount", amount);
        body.put("currency", currency != null ? currency : "USD");
        body.put("description", description);
        if (category != null && !category.isBlank()) {
            body.put("category", category);
        }

        restClient.post()
                .uri("/api/transactions")
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    /** Called when the circuit is open or all retries are exhausted. */
    @SuppressWarnings("unused")
    public void recordFallback(UUID sourceAccountId, UUID targetAccountId,
                               String type, BigDecimal amount, String currency,
                               String description, String category, Exception ex) {
        log.warn("Transactions service unavailable — circuit open. " +
                 "Transaction not recorded: type={} amount={} source={} error={}",
                 type, amount, sourceAccountId, ex.getMessage());
    }
}
