package com.vaultflow.transactions.repository;

import com.vaultflow.transactions.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findBySourceAccountIdOrderByCreatedAtDesc(UUID sourceAccountId);
}
