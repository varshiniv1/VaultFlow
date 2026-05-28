package com.vaultflow.notifications.repository;

import com.vaultflow.notifications.entity.Notification;
import com.vaultflow.notifications.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByAccountId(UUID accountId);

    List<Notification> findByStatus(NotificationStatus status);
}
