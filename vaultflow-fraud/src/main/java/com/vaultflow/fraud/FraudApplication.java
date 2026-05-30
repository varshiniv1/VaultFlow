package com.vaultflow.fraud;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@OpenAPIDefinition(
        info = @Info(
                title = "VaultFlow Fraud API",
                version = "1.0",
                description = "Fraud alert management with AI-powered analysis via Groq"
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SpringBootApplication
public class FraudApplication {

    public static void main(String[] args) {
        SpringApplication.run(FraudApplication.class, args);
    }
}
