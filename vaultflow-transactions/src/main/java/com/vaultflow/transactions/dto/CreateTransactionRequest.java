package com.vaultflow.transactions.dto;

import com.vaultflow.transactions.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateTransactionRequest {

    @NotNull
    private UUID sourceAccountId;

    private UUID targetAccountId;

    @NotNull
    private TransactionType type;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private String currency = "USD";

    private String description;

    /**
     * Optional user-selected category (e.g. "RENT_HOUSING", "GROCERIES", "INCOME", or a custom string).
     * When present, the AI tagger is skipped.
     */
    private String category;
}
