package com.vaultflow.transactions.controller;

import com.vaultflow.transactions.dto.CreateTransactionRequest;
import com.vaultflow.transactions.dto.TransactionResponse;
import com.vaultflow.transactions.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse createTransaction(@RequestBody @Valid CreateTransactionRequest request) {
        return transactionService.createTransaction(request);
    }

    @GetMapping("/{id}")
    public TransactionResponse getTransaction(@PathVariable UUID id) {
        return transactionService.getTransaction(id);
    }

    @GetMapping("/account/{accountId}")
    public List<TransactionResponse> getByAccount(@PathVariable UUID accountId) {
        return transactionService.getTransactionsByAccount(accountId);
    }
}
