package com.vaultflow.fraud.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Local copy of the transaction event payload consumed from Kafka.
 * Each service owns its own representation — no shared library coupling.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {

    private UUID transactionId;
    private UUID sourceAccountId;
    private UUID targetAccountId;
    private String type;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime occurredAt;
}
