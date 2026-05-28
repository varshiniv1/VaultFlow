package com.vaultflow.accounts.dto;

import com.vaultflow.accounts.entity.AccountStatus;
import com.vaultflow.accounts.entity.AccountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AccountResponse {

    private UUID id;
    private String accountNumber;
    private String ownerName;
    private AccountType accountType;
    private BigDecimal balance;
    private String currency;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
