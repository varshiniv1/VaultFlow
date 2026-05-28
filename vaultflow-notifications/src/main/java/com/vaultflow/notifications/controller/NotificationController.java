package com.vaultflow.notifications.controller;

import com.vaultflow.notifications.dto.NotificationResponse;
import com.vaultflow.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<NotificationResponse>> getByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(notificationService.getByAccount(accountId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.getById(id));
    }
}
