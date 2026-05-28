package com.vaultflow.fraud.ai;

import com.vaultflow.fraud.dto.FraudExplanation;
import com.vaultflow.fraud.entity.FraudAlert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudAnalyst {

    private static final String SYSTEM_PROMPT =
            "You are an expert fraud analyst at a bank. Analyze the fraud alert and respond in this exact format:\n" +
            "EXPLANATION: <one paragraph explaining why this was flagged>\n" +
            "RISK_LEVEL: <HIGH, MEDIUM, or LOW>\n" +
            "RECOMMENDATION: <one sentence recommended action for the bank>";

    private final GroqClient groqClient;

    public FraudExplanation explain(FraudAlert alert) {
        String userMessage = String.format(
                "Alert ID: %s\nTransaction ID: %s\nAccount ID: %s\nAmount: $%.2f\nReason: %s\nStatus: %s\nCreated: %s",
                alert.getId(), alert.getTransactionId(), alert.getAccountId(),
                alert.getAmount(), alert.getReason(), alert.getStatus(), alert.getCreatedAt()
        );

        String raw = groqClient.chat(SYSTEM_PROMPT, userMessage);
        if (raw == null) {
            return FraudExplanation.builder()
                    .explanation("AI analysis unavailable — GROQ_API_KEY not configured.")
                    .riskLevel("UNKNOWN")
                    .recommendation("Review manually.")
                    .build();
        }

        return parse(raw);
    }

    private FraudExplanation parse(String raw) {
        String explanation = extract(raw, "EXPLANATION:");
        String riskLevel   = extract(raw, "RISK_LEVEL:");
        String recommendation = extract(raw, "RECOMMENDATION:");
        return FraudExplanation.builder()
                .explanation(explanation)
                .riskLevel(riskLevel)
                .recommendation(recommendation)
                .build();
    }

    private String extract(String text, String label) {
        int start = text.indexOf(label);
        if (start == -1) return "";
        start += label.length();
        int end = findNextLabel(text, start);
        return text.substring(start, end).trim();
    }

    private int findNextLabel(String text, int from) {
        String[] labels = {"EXPLANATION:", "RISK_LEVEL:", "RECOMMENDATION:"};
        int earliest = text.length();
        for (String label : labels) {
            int pos = text.indexOf(label, from);
            if (pos != -1 && pos < earliest) earliest = pos;
        }
        return earliest;
    }
}
