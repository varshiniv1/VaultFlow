package com.vaultflow.transactions;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@OpenAPIDefinition(
        info = @Info(
                title = "VaultFlow Transactions API",
                version = "1.0",
                description = "Record and query financial transactions; AI-powered category tagging"
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SpringBootApplication
public class TransactionsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransactionsApplication.class, args);
    }
}
