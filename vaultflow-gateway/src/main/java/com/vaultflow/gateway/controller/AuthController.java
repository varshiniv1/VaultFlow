package com.vaultflow.gateway.controller;

import com.vaultflow.gateway.dto.AuthRequest;
import com.vaultflow.gateway.dto.AuthResponse;
import com.vaultflow.gateway.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        String stored = USERS.get(request.getEmail());
        if (stored == null || !stored.equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtService.generate(request.getEmail());
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .email(request.getEmail())
                .expiresIn(86400)
                .build());
    }
}
