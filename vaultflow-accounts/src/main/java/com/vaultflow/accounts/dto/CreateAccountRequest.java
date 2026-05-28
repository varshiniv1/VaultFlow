package com.vaultflow.accounts.dto;

import com.vaultflow.accounts.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountRequest {

    @NotBlank
    private String ownerName;

    @NotNull
    private AccountType accountType;

    private String currency = "USD";
}
