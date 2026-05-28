package com.vaultflow.notifications.dto;

import com.vaultflow.notifications.entity.NotificationStatus;
import com.vaultflow.notifications.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;
    private UUID accountId;
    private UUID transactionId;
    private NotificationType type;
    private String message;
    private NotificationStatus status;
    private LocalDateTime createdAt;
}
