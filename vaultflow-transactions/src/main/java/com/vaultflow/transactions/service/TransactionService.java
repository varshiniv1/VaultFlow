package com.vaultflow.transactions.service;

import com.vaultflow.transactions.dto.CreateTransactionRequest;
import com.vaultflow.transactions.dto.TransactionResponse;
import com.vaultflow.transactions.entity.Transaction;
import com.vaultflow.transactions.entity.TransactionStatus;
import com.vaultflow.transactions.event.TransactionEvent;
import com.vaultflow.transactions.kafka.TransactionProducer;
import com.vaultflow.transactions.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionProducer transactionProducer;

    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        Transaction transaction = Transaction.builder()
                .sourceAccountId(request.getSourceAccountId())
                .targetAccountId(request.getTargetAccountId())
                .type(request.getType())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.COMPLETED)
                .description(request.getDescription())
                .build();

        Transaction saved = transactionRepository.save(transaction);

        transactionProducer.publish(TransactionEvent.builder()
                .transactionId(saved.getId())
                .sourceAccountId(saved.getSourceAccountId())
                .targetAccountId(saved.getTargetAccountId())
                .type(saved.getType())
                .amount(saved.getAmount())
                .currency(saved.getCurrency())
                .occurredAt(LocalDateTime.now())
                .build());

        return toResponse(saved);
    }

    public TransactionResponse getTransaction(UUID id) {
        return transactionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
    }

    public List<TransactionResponse> getTransactionsByAccount(UUID accountId) {
        return transactionRepository.findBySourceAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .sourceAccountId(t.getSourceAccountId())
                .targetAccountId(t.getTargetAccountId())
                .type(t.getType())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .status(t.getStatus())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
