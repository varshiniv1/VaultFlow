package com.vaultflow.gateway.controller;

import com.vaultflow.gateway.dto.AuthRequest;
import com.vaultflow.gateway.dto.AuthResponse;
import com.vaultflow.gateway.dto.ChangePasswordRequest;
import com.vaultflow.gateway.dto.MeResponse;
import com.vaultflow.gateway.dto.RefreshRequest;
import com.vaultflow.gateway.dto.RegisterRequest;
import com.vaultflow.gateway.security.RefreshToken;
import com.vaultflow.gateway.service.JwtService;
import com.vaultflow.gateway.service.LoginAttemptService;
import com.vaultflow.gateway.service.RefreshTokenService;
import com.vaultflow.gateway.service.UserStore;
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

    private final JwtService           jwtService;
    private final RefreshTokenService  refreshTokenService;
    private final LoginAttemptService  loginAttemptService;
    private final UserStore            userStore;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank() || request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and a password of at least 6 characters are required."));
        }
        if (!userStore.register(email, request.getPassword())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with that email already exists."));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(buildResponse(email.toLowerCase()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        String email = request.getEmail();

        if (loginAttemptService.isLocked(email)) {
            long seconds = loginAttemptService.secondsUntilUnlock(email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "error",   "Account temporarily locked",
                            "message", "Too many failed login attempts. Try again in " + seconds + " seconds."
                    ));
        }

        if (!userStore.verify(email, request.getPassword())) {
            loginAttemptService.loginFailed(email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        loginAttemptService.loginSucceeded(email);
        return ResponseEntity.ok(buildResponse(email));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal String email,
            @RequestBody ChangePasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 6 characters."));
        }
        if (!userStore.updatePassword(email, request.getCurrentPassword(), request.getNewPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Current password is incorrect."));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(MeResponse.builder().email(email).build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return refreshTokenService.find(request.getRefreshToken())
                .map(rt -> {
                    if (rt.isExpired()) {
                        refreshTokenService.delete(rt.getToken());
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build();
                    }
                    refreshTokenService.delete(rt.getToken());
                    return ResponseEntity.ok(buildResponse(rt.getEmail()));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequest request) {
        refreshTokenService.delete(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    private AuthResponse buildResponse(String email) {
        RefreshToken rt = refreshTokenService.create(email);
        return AuthResponse.builder()
                .token(jwtService.generate(email, userStore.getRole(email)))
                .refreshToken(rt.getToken())
                .type("Bearer")
                .email(email)
                .expiresIn(900)
                .build();
    }
}
