package com.vaultflow.fraud.dto;

import com.vaultflow.fraud.entity.AlertStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FraudAlertResponse {

    private UUID id;
    private UUID transactionId;
    private UUID accountId;
    private BigDecimal amount;
    private String reason;
    private AlertStatus status;
    private LocalDateTime createdAt;
}
