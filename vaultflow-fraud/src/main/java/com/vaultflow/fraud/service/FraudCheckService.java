package com.vaultflow.fraud.service;

import com.vaultflow.fraud.dto.FraudAlertResponse;
import com.vaultflow.fraud.entity.AlertStatus;
import com.vaultflow.fraud.entity.FraudAlert;
import com.vaultflow.fraud.event.TransactionEvent;
import com.vaultflow.fraud.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudCheckService {

    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("10000.00");

    private final FraudAlertRepository fraudAlertRepository;

    public void evaluate(TransactionEvent event) {
        if (event.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            FraudAlert alert = FraudAlert.builder()
                    .transactionId(event.getTransactionId())
                    .accountId(event.getSourceAccountId())
                    .amount(event.getAmount())
                    .reason("Transaction amount exceeds $10,000 threshold")
                    .status(AlertStatus.OPEN)
                    .build();

            fraudAlertRepository.save(alert);
            log.warn("Fraud alert raised for transaction {}: amount={}", event.getTransactionId(), event.getAmount());
        }
    }

    public List<FraudAlertResponse> getAlertsByStatus(AlertStatus status) {
        return fraudAlertRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FraudAlertResponse> getAlertsByAccount(UUID accountId) {
        return fraudAlertRepository.findByAccountId(accountId).stream()
                .map(this::toResponse)
                .toList();
    }

    public FraudAlertResponse getAlert(UUID id) {
        FraudAlert alert = fraudAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + id));
        return toResponse(alert);
    }

    public FraudAlertResponse dismiss(UUID id) {
        FraudAlert alert = fraudAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + id));
        alert.setStatus(AlertStatus.DISMISSED);
        return toResponse(fraudAlertRepository.save(alert));
    }

    public FraudAlertResponse markReviewed(UUID id) {
        FraudAlert alert = fraudAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + id));
        alert.setStatus(AlertStatus.REVIEWED);
        return toResponse(fraudAlertRepository.save(alert));
    }

    private FraudAlertResponse toResponse(FraudAlert alert) {
        return FraudAlertResponse.builder()
                .id(alert.getId())
                .transactionId(alert.getTransactionId())
                .accountId(alert.getAccountId())
                .amount(alert.getAmount())
                .reason(alert.getReason())
                .status(alert.getStatus())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
