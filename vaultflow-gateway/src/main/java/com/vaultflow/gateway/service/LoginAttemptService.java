package com.vaultflow.gateway.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks failed login attempts and enforces a 15-minute lockout after
 * 5 consecutive failures — purely in-memory, no Redis or DB required.
 *
 * Trade-off: the lockout resets on a service restart.
 * For a multi-node deployment, move to a shared cache (Redis).
 */
@Slf4j
@Service
public class LoginAttemptService {

    private static final int    MAX_ATTEMPTS      = 5;
    private static final long   LOCKOUT_MINUTES   = 15;
    private static final long   LOCKOUT_MILLIS    = LOCKOUT_MINUTES * 60 * 1_000L;

    private record AttemptRecord(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    /** Returns true if this email is currently locked out. */
    public boolean isLocked(String email) {
        AttemptRecord record = attempts.get(email);
        if (record == null) return false;
        if (record.lockedUntil() != null && Instant.now().isBefore(record.lockedUntil())) {
            return true;
        }
        // Lockout has expired — clear it
        if (record.lockedUntil() != null) {
            attempts.remove(email);
        }
        return false;
    }

    /** Call this after a successful login to reset the counter. */
    public void loginSucceeded(String email) {
        attempts.remove(email);
    }

    /**
     * Call this after a failed login attempt.
     * Locks the account for {@value LOCKOUT_MINUTES} minutes after {@value MAX_ATTEMPTS} failures.
     */
    public void loginFailed(String email) {
        AttemptRecord current = attempts.getOrDefault(email, new AttemptRecord(0, null));

        // If there's an expired lockout record, start fresh
        if (current.lockedUntil() != null && Instant.now().isAfter(current.lockedUntil())) {
            current = new AttemptRecord(0, null);
        }

        int newCount = current.count() + 1;
        Instant lockUntil = null;

        if (newCount >= MAX_ATTEMPTS) {
            lockUntil = Instant.now().plusMillis(LOCKOUT_MILLIS);
            log.warn("Account locked for {} minutes after {} failed attempts: email={}",
                     LOCKOUT_MINUTES, MAX_ATTEMPTS, email);
        }

        attempts.put(email, new AttemptRecord(newCount, lockUntil));
    }

    /** Returns remaining lockout seconds (0 if not locked). */
    public long secondsUntilUnlock(String email) {
        AttemptRecord record = attempts.get(email);
        if (record == null || record.lockedUntil() == null) return 0;
        long remaining = record.lockedUntil().toEpochMilli() - Instant.now().toEpochMilli();
        return Math.max(0, remaining / 1000);
    }
}
