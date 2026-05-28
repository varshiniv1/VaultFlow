package com.vaultflow.transactions.kafka;

import com.vaultflow.transactions.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionProducer {

    static final String TOPIC = "transaction-events";

    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;

    public void publish(TransactionEvent event) {
        kafkaTemplate.send(TOPIC, event.getTransactionId().toString(), event);
        log.info("Published transaction event: {}", event.getTransactionId());
    }
}
