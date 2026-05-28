package com.vaultflow.fraud.controller;

import com.vaultflow.fraud.dto.FraudAlertResponse;
import com.vaultflow.fraud.entity.AlertStatus;
import com.vaultflow.fraud.service.FraudCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fraud/alerts")
@RequiredArgsConstructor
public class FraudAlertController {

    private final FraudCheckService fraudCheckService;

    @GetMapping
    public ResponseEntity<List<FraudAlertResponse>> getAlerts(
            @RequestParam(required = false) AlertStatus status) {
        if (status != null) {
            return ResponseEntity.ok(fraudCheckService.getAlertsByStatus(status));
        }
        return ResponseEntity.ok(fraudCheckService.getAlertsByStatus(AlertStatus.OPEN));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FraudAlertResponse> getAlert(@PathVariable UUID id) {
        return ResponseEntity.ok(fraudCheckService.getAlert(id));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<FraudAlertResponse>> getAlertsByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(fraudCheckService.getAlertsByAccount(accountId));
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<FraudAlertResponse> dismiss(@PathVariable UUID id) {
        return ResponseEntity.ok(fraudCheckService.dismiss(id));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<FraudAlertResponse> review(@PathVariable UUID id) {
        return ResponseEntity.ok(fraudCheckService.markReviewed(id));
    }
}
