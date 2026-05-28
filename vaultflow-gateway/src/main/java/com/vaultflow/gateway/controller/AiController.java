package com.vaultflow.gateway.controller;

import com.vaultflow.gateway.ai.GroqClient;
import com.vaultflow.gateway.dto.ChatRequest;
import com.vaultflow.gateway.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final String SYSTEM_PROMPT =
            "You are a helpful banking assistant for VaultFlow, a modern digital banking platform. " +
            "You assist users with questions about their accounts, transactions, transfers, and how to use VaultFlow. " +
            "VaultFlow features: CHECKING and SAVINGS accounts, deposits, withdrawals, transfers between accounts, " +
            "real-time fraud detection (flags transactions over $10,000), and email notifications for all transactions. " +
            "The API is accessible via a gateway at port 8080. " +
            "Be concise, professional, and helpful. Never make up specific account data — " +
            "if asked for real balances or transaction history, tell the user to check the accounts or transactions endpoints.";

    private final GroqClient groqClient;

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody @Valid ChatRequest request,
                             @AuthenticationPrincipal String email) {
        String userMessage = "[User: " + email + "] " + request.getMessage();
        String reply = groqClient.chat(SYSTEM_PROMPT, userMessage);
        if (reply == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI assistant unavailable — GROQ_API_KEY not configured");
        }
        return ChatResponse.builder().reply(reply).build();
    }
}
