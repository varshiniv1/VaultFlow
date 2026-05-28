package com.vaultflow.accounts.repository;

import com.vaultflow.accounts.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {

    /** Purge records older than the given cutoff (run periodically to keep the table small). */
    @Modifying
    @Transactional
    @Query("DELETE FROM IdempotencyRecord r WHERE r.createdAt < :cutoff")
    int deleteOlderThan(LocalDateTime cutoff);
}
