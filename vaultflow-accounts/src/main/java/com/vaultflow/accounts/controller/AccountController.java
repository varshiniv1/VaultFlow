package com.vaultflow.accounts.controller;

import com.vaultflow.accounts.dto.AccountResponse;
import com.vaultflow.accounts.dto.CreateAccountRequest;
import com.vaultflow.accounts.dto.DepositRequest;
import com.vaultflow.accounts.dto.TransferRequest;
import com.vaultflow.accounts.dto.WithdrawRequest;
import com.vaultflow.accounts.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse createAccount(@RequestBody @Valid CreateAccountRequest request) {
        return accountService.createAccount(request);
    }

    @GetMapping("/{id}")
    public AccountResponse getAccount(@PathVariable UUID id) {
        return accountService.getAccount(id);
    }

    @GetMapping("/number/{accountNumber}")
    public AccountResponse getByAccountNumber(@PathVariable String accountNumber) {
        return accountService.getByAccountNumber(accountNumber);
    }

    @GetMapping
    public List<AccountResponse> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @PostMapping("/{id}/deposit")
    public AccountResponse deposit(@PathVariable UUID id,
                                   @RequestBody @Valid DepositRequest request) {
        return accountService.deposit(id, request);
    }

    @PostMapping("/{id}/withdraw")
    public AccountResponse withdraw(@PathVariable UUID id,
                                    @RequestBody @Valid WithdrawRequest request) {
        return accountService.withdraw(id, request);
    }

    @PostMapping("/{id}/transfer")
    public AccountResponse transfer(@PathVariable UUID id,
                                    @RequestBody @Valid TransferRequest request) {
        return accountService.transfer(id, request);
    }

    @PatchMapping("/{id}/freeze")
    public AccountResponse freeze(@PathVariable UUID id) {
        return accountService.freeze(id);
    }

    @PatchMapping("/{id}/unfreeze")
    public AccountResponse unfreeze(@PathVariable UUID id) {
        return accountService.unfreeze(id);
    }

    @PatchMapping("/{id}/close")
    public AccountResponse close(@PathVariable UUID id) {
        return accountService.close(id);
    }
}
