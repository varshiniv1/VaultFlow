package com.vaultflow.notifications.service;

import com.vaultflow.notifications.dto.NotificationResponse;
import com.vaultflow.notifications.entity.Notification;
import com.vaultflow.notifications.entity.NotificationStatus;
import com.vaultflow.notifications.entity.NotificationType;
import com.vaultflow.notifications.event.TransactionEvent;
import com.vaultflow.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("10000.00");

    private final NotificationRepository notificationRepository;

    public void handleTransactionEvent(TransactionEvent event) {
        NotificationType type = resolveType(event);
        String message = buildMessage(event, type);

        Notification notification = Notification.builder()
                .accountId(event.getSourceAccountId())
                .transactionId(event.getTransactionId())
                .type(type)
                .message(message)
                .status(NotificationStatus.SENT)
                .build();

        notificationRepository.save(notification);
        log.info("Notification sent [{}] for account {} — {}", type, event.getSourceAccountId(), message);

        // If target is different, send a received notification as well
        if (event.getTargetAccountId() != null &&
                !event.getTargetAccountId().equals(event.getSourceAccountId())) {
            Notification inbound = Notification.builder()
                    .accountId(event.getTargetAccountId())
                    .transactionId(event.getTransactionId())
                    .type(NotificationType.TRANSFER_RECEIVED)
                    .message("You received " + event.getAmount() + " " + event.getCurrency())
                    .status(NotificationStatus.SENT)
                    .build();
            notificationRepository.save(inbound);
            log.info("Notification sent [TRANSFER_RECEIVED] for account {}", event.getTargetAccountId());
        }
    }

    public List<NotificationResponse> getByAccount(UUID accountId) {
        return notificationRepository.findByAccountId(accountId).stream()
                .map(this::toResponse)
                .toList();
    }

    public NotificationResponse getById(UUID id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        return toResponse(n);
    }

    private NotificationType resolveType(TransactionEvent event) {
        if (event.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            return NotificationType.HIGH_VALUE_TRANSACTION;
        }
        return switch (event.getType().toUpperCase()) {
            case "TRANSFER" -> NotificationType.TRANSFER_SENT;
            default -> NotificationType.TRANSACTION_COMPLETED;
        };
    }

    private String buildMessage(TransactionEvent event, NotificationType type) {
        return switch (type) {
            case HIGH_VALUE_TRANSACTION ->
                    "High-value transaction of " + event.getAmount() + " " + event.getCurrency() + " was processed.";
            case TRANSFER_SENT ->
                    "You sent " + event.getAmount() + " " + event.getCurrency() + ".";
            default ->
                    "Transaction of " + event.getAmount() + " " + event.getCurrency() + " completed.";
        };
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .accountId(n.getAccountId())
                .transactionId(n.getTransactionId())
                .type(n.getType())
                .message(n.getMessage())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
