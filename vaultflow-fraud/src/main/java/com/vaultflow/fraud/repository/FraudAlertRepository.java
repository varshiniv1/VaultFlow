package com.vaultflow.fraud.repository;

import com.vaultflow.fraud.entity.AlertStatus;
import com.vaultflow.fraud.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {

    List<FraudAlert> findByStatus(AlertStatus status);

    List<FraudAlert> findByAccountId(UUID accountId);
}
