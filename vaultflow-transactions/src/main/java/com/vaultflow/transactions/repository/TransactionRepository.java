package com.vaultflow.transactions.repository;

import com.vaultflow.transactions.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findBySourceAccountIdOrderByCreatedAtDesc(UUID sourceAccountId);

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccountId = :id OR t.targetAccountId = :id ORDER BY t.createdAt DESC")
    List<Transaction> findAllByAccountId(@Param("id") UUID id);
}
