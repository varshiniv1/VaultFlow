package com.vaultflow.transactions.kafka;

import com.vaultflow.transactions.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionProducer {

    static final String TOPIC = "transaction-events";

    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;

    /**
     * Fire-and-forget publish.
     *
     * Runs in a daemon thread so a Kafka outage NEVER blocks or fails the HTTP request.
     * The transaction is already persisted in the DB at the point this is called;
     * the Kafka event is best-effort (for notifications/fraud detection).
     */
    public void publish(TransactionEvent event) {
        CompletableFuture.runAsync(() -> {
            try {
                kafkaTemplate.send(TOPIC, event.getTransactionId().toString(), event)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.warn("Kafka publish failed for transaction {} — event dropped: {}",
                                        event.getTransactionId(), ex.getMessage());
                            } else {
                                log.info("Published transaction event: {} offset={}",
                                        event.getTransactionId(),
                                        result.getRecordMetadata().offset());
                            }
                        });
            } catch (Exception e) {
                log.warn("Kafka send could not be initiated for transaction {} — Kafka may be down: {}",
                        event.getTransactionId(), e.getMessage());
            }
        });
    }
}
