package com.vaultflow.accounts;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@OpenAPIDefinition(
        info = @Info(
                title = "VaultFlow Accounts API",
                version = "1.0",
                description = "Manage bank accounts — create, deposit, withdraw, transfer, freeze/unfreeze/close"
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SpringBootApplication
public class AccountsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountsApplication.class, args);
    }
}
