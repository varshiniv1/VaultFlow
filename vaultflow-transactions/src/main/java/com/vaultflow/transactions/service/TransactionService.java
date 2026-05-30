package com.vaultflow.transactions.service;

import com.vaultflow.transactions.ai.TransactionTagger;
import com.vaultflow.transactions.dto.CreateTransactionRequest;
import com.vaultflow.transactions.dto.TransactionResponse;
import com.vaultflow.transactions.entity.Transaction;
import com.vaultflow.transactions.entity.TransactionStatus;
import com.vaultflow.transactions.event.TransactionEvent;
import com.vaultflow.transactions.kafka.TransactionProducer;
import com.vaultflow.transactions.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionProducer transactionProducer;
    private final TransactionTagger transactionTagger;

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

        // User-selected category wins; fall back to AI tagger only when none was provided
        String category = (request.getCategory() != null && !request.getCategory().isBlank())
                ? request.getCategory()
                : transactionTagger.tag(saved);
        saved.setCategory(category);
        saved = transactionRepository.save(saved);

        try {
            transactionProducer.publish(TransactionEvent.builder()
                    .transactionId(saved.getId())
                    .sourceAccountId(saved.getSourceAccountId())
                    .targetAccountId(saved.getTargetAccountId())
                    .type(saved.getType())
                    .amount(saved.getAmount())
                    .currency(saved.getCurrency())
                    .occurredAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            // Kafka publish is best-effort — a failure here must never fail the transaction.
            // The record is already saved to the DB.
            log.warn("Could not initiate Kafka publish for transaction {} — Kafka may be unavailable: {}",
                    saved.getId(), e.getMessage());
        }

        return toResponse(saved);
    }

    public TransactionResponse getTransaction(UUID id) {
        return transactionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
    }

    public List<TransactionResponse> getTransactionsByAccount(UUID accountId) {
        return transactionRepository.findAllByAccountId(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TransactionResponse retag(UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
        transaction.setCategory(transactionTagger.tag(transaction));
        return toResponse(transactionRepository.save(transaction));
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
                .category(t.getCategory())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
