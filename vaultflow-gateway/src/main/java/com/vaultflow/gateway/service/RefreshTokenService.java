package com.vaultflow.gateway.service;

import com.vaultflow.gateway.security.RefreshToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    // token string → RefreshToken; concurrent for thread safety
    private final ConcurrentHashMap<String, RefreshToken> store = new ConcurrentHashMap<>();

    public RefreshToken create(String email) {
        RefreshToken rt = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .email(email)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .build();
        store.put(rt.getToken(), rt);
        return rt;
    }

    public Optional<RefreshToken> find(String token) {
        return Optional.ofNullable(store.get(token));
    }

    public void delete(String token) {
        store.remove(token);
    }

    /** Delete all refresh tokens for an account (full logout). */
    public void deleteAll(String email) {
        store.values().removeIf(rt -> rt.getEmail().equals(email));
    }
}
