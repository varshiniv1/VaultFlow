package com.vaultflow.transactions.event;

import com.vaultflow.transactions.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {

    private UUID transactionId;
    private UUID sourceAccountId;
    private UUID targetAccountId;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime occurredAt;
}
