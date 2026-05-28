package com.vaultflow.gateway.controller;

import com.vaultflow.gateway.dto.AuthRequest;
import com.vaultflow.gateway.dto.AuthResponse;
import com.vaultflow.gateway.dto.MeResponse;
import com.vaultflow.gateway.dto.RefreshRequest;
import com.vaultflow.gateway.security.RefreshToken;
import com.vaultflow.gateway.service.JwtService;
import com.vaultflow.gateway.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Demo credential store — swap for a real UserRepository in production
    private static final Map<String, String> USERS = Map.of(
            "admin@vaultflow.com", "admin123",
            "user@vaultflow.com", "user123"
    );

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        String stored = USERS.get(request.getEmail());
        if (stored == null || !stored.equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(buildResponse(request.getEmail()));
    }

    /** Returns the identity of the currently authenticated caller. */
    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(MeResponse.builder().email(email).build());
    }

    /**
     * Issues a new access token + rotates the refresh token.
     * The old refresh token is invalidated on use (rotation prevents replay attacks).
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return refreshTokenService.find(request.getRefreshToken())
                .map(rt -> {
                    if (rt.isExpired()) {
                        refreshTokenService.delete(rt.getToken());
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build();
                    }
                    // Rotate: delete old token, issue new pair
                    refreshTokenService.delete(rt.getToken());
                    return ResponseEntity.ok(buildResponse(rt.getEmail()));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /** Invalidates the supplied refresh token (single-device logout). */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequest request) {
        refreshTokenService.delete(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    private AuthResponse buildResponse(String email) {
        RefreshToken rt = refreshTokenService.create(email);
        return AuthResponse.builder()
                .token(jwtService.generate(email))
                .refreshToken(rt.getToken())
                .type("Bearer")
                .email(email)
                .expiresIn(900)
                .build();
    }
}
