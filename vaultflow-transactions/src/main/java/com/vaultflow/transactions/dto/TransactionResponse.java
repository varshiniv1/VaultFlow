package com.vaultflow.transactions.dto;

import com.vaultflow.transactions.entity.TransactionStatus;
import com.vaultflow.transactions.entity.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {

    private UUID id;
    private UUID sourceAccountId;
    private UUID targetAccountId;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private TransactionStatus status;
    private String description;
    private String category;
    private LocalDateTime createdAt;
}
