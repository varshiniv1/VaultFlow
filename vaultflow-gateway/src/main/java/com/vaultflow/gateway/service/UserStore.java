package com.vaultflow.gateway.service;

import com.vaultflow.gateway.entity.User;
import com.vaultflow.gateway.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gateway user service — all user data is persisted in users_db (PostgreSQL).
 *
 * Why a database instead of in-memory or file storage?
 *   • Survives restarts and crashes without data loss
 *   • Works correctly with multiple gateway instances (horizontal scaling)
 *   • Concurrent writes are handled safely by the DB (ACID transactions)
 *   • Enables future features: email verification, password-reset tokens, audit log
 *   • Consistent with every other VaultFlow microservice (each owns its own DB)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserStore {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Seed built-in accounts on first startup only.
     * insertIfAbsent semantics: if the row already exists (restart scenario)
     * we leave it untouched so a changed password is never silently overwritten.
     */
    @PostConstruct
    @Transactional
    void seed() {
        seedIfAbsent("admin@vaultflow.com", "admin123", "ADMIN");
        seedIfAbsent("user@vaultflow.com",  "user123",  "USER");
        log.info("UserStore ready — {} account(s) in users_db", userRepository.count());
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Returns false if the email is already taken. */
    @Transactional
    public boolean register(String email, String rawPassword) {
        String key = email.toLowerCase();
        if (userRepository.existsByEmail(key)) return false;
        userRepository.save(User.builder()
                .email(key)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role("USER")
                .build());
        return true;
    }

    /** Returns true if the credentials are valid. */
    public boolean verify(String email, String rawPassword) {
        return userRepository.findByEmail(email.toLowerCase())
                .map(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                .orElse(false);
    }

    @Transactional
    public boolean updatePassword(String email, String currentPassword, String newPassword) {
        return userRepository.findByEmail(email.toLowerCase())
                .filter(u -> passwordEncoder.matches(currentPassword, u.getPasswordHash()))
                .map(u -> {
                    u.setPasswordHash(passwordEncoder.encode(newPassword));
                    userRepository.save(u);
                    return true;
                })
                .orElse(false);
    }

    public boolean exists(String email) {
        return userRepository.existsByEmail(email.toLowerCase());
    }

    public String getRole(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .map(User::getRole)
                .orElse("USER");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void seedIfAbsent(String email, String rawPassword, String role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .build());
            log.info("Seeded built-in account: {}", email);
        }
    }
}
