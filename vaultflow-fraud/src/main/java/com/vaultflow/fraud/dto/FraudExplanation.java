package com.vaultflow.fraud.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FraudExplanation {
    private String explanation;
    private String riskLevel;
    private String recommendation;
}
