package com.vaultflow.notifications.kafka;

import com.vaultflow.notifications.event.TransactionEvent;
import com.vaultflow.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "transaction-events", groupId = "notifications-service",
            containerFactory = "kafkaListenerContainerFactory")
    public void consume(TransactionEvent event) {
        log.info("Received transaction event: id={} type={} amount={}",
                event.getTransactionId(), event.getType(), event.getAmount());
        notificationService.handleTransactionEvent(event);
    }
}
