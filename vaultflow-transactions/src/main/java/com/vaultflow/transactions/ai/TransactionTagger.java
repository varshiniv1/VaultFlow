package com.vaultflow.transactions.ai;

import com.vaultflow.transactions.entity.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionTagger {

    private static final String SYSTEM_PROMPT =
            "You are a bank transaction categorizer. Given a transaction's type, amount, and description, " +
            "respond with exactly one category from this list: " +
            "RENT_HOUSING, GROCERIES, FOOD_DINING, UTILITIES, TRANSPORT, INCOME, HEALTHCARE, ENTERTAINMENT, SHOPPING, TRAVEL, TRANSFER, OTHER. " +
            "Respond with only the category name — no punctuation, no explanation.";

    private final GroqClient groqClient;

    public String tag(Transaction transaction) {
        String userMessage = String.format(
                "Type: %s | Amount: %.2f %s | Description: %s",
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getDescription() != null ? transaction.getDescription() : "none"
        );
        try {
            String result = groqClient.chat(SYSTEM_PROMPT, userMessage);
            if (result != null) {
                return result.trim().toUpperCase().replaceAll("[^A-Z_]", "");
            }
        } catch (Exception e) {
            log.warn("Tagging failed for transaction {}: {}", transaction.getId(), e.getMessage());
        }
        return "OTHER";
    }
}
