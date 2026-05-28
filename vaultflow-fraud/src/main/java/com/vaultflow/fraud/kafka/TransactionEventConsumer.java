package com.vaultflow.fraud.kafka;

import com.vaultflow.fraud.event.TransactionEvent;
import com.vaultflow.fraud.service.FraudCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

    private final FraudCheckService fraudCheckService;

    @KafkaListener(topics = "transaction-events", groupId = "fraud-service",
            containerFactory = "kafkaListenerContainerFactory")
    public void consume(TransactionEvent event) {
        log.info("Received transaction event: id={} amount={}", event.getTransactionId(), event.getAmount());
        fraudCheckService.evaluate(event);
    }
}
