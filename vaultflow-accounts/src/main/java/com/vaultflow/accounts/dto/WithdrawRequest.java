package com.vaultflow.accounts.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawRequest {

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private String description;

    /** Optional user-selected category. Null = let the AI tagger decide. */
    private String category;
}
