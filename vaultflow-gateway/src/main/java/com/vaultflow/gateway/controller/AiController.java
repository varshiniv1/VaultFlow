package com.vaultflow.gateway.controller;

import com.vaultflow.gateway.ai.GroqClient;
import com.vaultflow.gateway.dto.ChatRequest;
import com.vaultflow.gateway.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final String BASE_SYSTEM_PROMPT =
            "You are a smart, friendly banking assistant for VaultFlow — a modern digital banking platform. " +
            "You have full access to the user's real-time account and transaction data shown below. " +
            "Answer questions directly using that data (balances, transaction history, spending patterns, etc.). " +
            "Format currency values neatly (e.g. $1,234.56). " +
            "VaultFlow features: CHECKING and SAVINGS accounts, deposits, withdrawals, transfers, " +
            "AI-powered transaction categorisation, real-time fraud detection (flags over $10,000), " +
            "and instant notifications for every transaction. " +
            "Be concise, professional, and accurate. Do not make up data beyond what is provided.";

    private final GroqClient groqClient;

    @Value("${services.accounts.url:http://localhost:8081}")
    private String accountsUrl;

    @Value("${services.transactions.url:http://localhost:8082}")
    private String transactionsUrl;

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody @Valid ChatRequest request,
                             @AuthenticationPrincipal String email) {

        // Build live context from real account + transaction data
        String context = buildContext();
        String systemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + context;

        String reply = groqClient.chatWithHistory(systemPrompt, request.getHistory(), request.getMessage());
        if (reply == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI assistant unavailable — GROQ_API_KEY not configured");
        }
        return ChatResponse.builder().reply(reply).build();
    }

    // ── Fetch live data and build the context block ───────────────────────────

    @SuppressWarnings("unchecked")
    private String buildContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== LIVE ACCOUNT DATA ===\n");

        try {
            RestClient rc = RestClient.builder().baseUrl(accountsUrl).build();
            List<Map<String, Object>> accounts = rc.get()
                    .uri("/api/accounts")
                    .retrieve()
                    .body(List.class);

            if (accounts == null || accounts.isEmpty()) {
                sb.append("No accounts found.\n");
                return sb.toString();
            }

            BigDecimal totalBalance = BigDecimal.ZERO;
            for (Map<String, Object> acc : accounts) {
                String id          = String.valueOf(acc.get("id"));
                String number      = String.valueOf(acc.get("accountNumber"));
                String type        = String.valueOf(acc.get("accountType"));
                String status      = String.valueOf(acc.get("status"));
                String currency    = String.valueOf(acc.get("currency"));
                Object rawBal      = acc.get("balance");
                BigDecimal balance = rawBal instanceof Number
                        ? new BigDecimal(rawBal.toString()) : BigDecimal.ZERO;
                totalBalance = totalBalance.add(balance);

                sb.append(String.format("Account: %s (%s) | Status: %s | Balance: %s %s\n",
                        number.substring(Math.max(0, number.length() - 6)),
                        type, status, balance.toPlainString(), currency));

                // Fetch last 5 transactions for this account
                appendTransactions(sb, id);
            }
            sb.append(String.format("\nTotal portfolio balance: %s\n", totalBalance.toPlainString()));

        } catch (Exception e) {
            log.debug("Could not fetch account context for AI: {}", e.getMessage());
            sb.append("(Account data temporarily unavailable)\n");
        }

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private void appendTransactions(StringBuilder sb, String accountId) {
        try {
            RestClient rc = RestClient.builder().baseUrl(transactionsUrl).build();
            List<Map<String, Object>> txns = rc.get()
                    .uri("/api/transactions/account/" + accountId)
                    .retrieve()
                    .body(List.class);

            if (txns == null || txns.isEmpty()) {
                sb.append("  No transactions yet.\n");
                return;
            }

            sb.append("  Recent transactions (newest first):\n");
            txns.stream().limit(5).forEach(t -> {
                String type     = String.valueOf(t.get("type"));
                String amount   = String.valueOf(t.get("amount"));
                String currency = String.valueOf(t.get("currency"));
                String category = t.get("category") != null ? String.valueOf(t.get("category")) : "—";
                String status   = String.valueOf(t.get("status"));
                String desc     = t.get("description") != null ? String.valueOf(t.get("description")) : "";
                String date     = String.valueOf(t.get("createdAt")).substring(0, Math.min(10,
                        String.valueOf(t.get("createdAt")).length()));
                sb.append(String.format("    [%s] %s %s %s | cat: %s | %s%s\n",
                        date, type, amount, currency, category, status,
                        desc.isBlank() ? "" : " | note: " + desc));
            });

            // Spending summary
            Map<String, BigDecimal> spendByCategory = new java.util.LinkedHashMap<>();
            txns.stream()
                    .filter(t -> "WITHDRAWAL".equals(t.get("type")) || "TRANSFER".equals(t.get("type")))
                    .forEach(t -> {
                        String cat = t.get("category") != null ? String.valueOf(t.get("category")) : "OTHER";
                        Object rawAmt = t.get("amount");
                        BigDecimal amt = rawAmt instanceof Number
                                ? new BigDecimal(rawAmt.toString()) : BigDecimal.ZERO;
                        spendByCategory.merge(cat, amt, BigDecimal::add);
                    });

            if (!spendByCategory.isEmpty()) {
                sb.append("  Spending by category: ");
                spendByCategory.forEach((cat, total) ->
                        sb.append(cat).append("=").append(total.toPlainString()).append(" "));
                sb.append("\n");
            }

        } catch (Exception e) {
            log.debug("Could not fetch transactions for account {}: {}", accountId, e.getMessage());
        }
    }
}
