package com.vaultflow.accounts.service;

import com.vaultflow.accounts.client.TransactionClient;
import com.vaultflow.accounts.dto.AccountResponse;
import com.vaultflow.accounts.dto.CreateAccountRequest;
import com.vaultflow.accounts.dto.DepositRequest;
import com.vaultflow.accounts.dto.TransferRequest;
import com.vaultflow.accounts.dto.WithdrawRequest;
import com.vaultflow.accounts.entity.Account;
import com.vaultflow.accounts.entity.AccountStatus;
import com.vaultflow.accounts.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionClient transactionClient;

    public AccountResponse createAccount(CreateAccountRequest request) {
        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .ownerName(request.getOwnerName())
                .accountType(request.getAccountType())
                .balance(BigDecimal.ZERO)
                .currency(request.getCurrency())
                .status(AccountStatus.ACTIVE)
                .build();

        return toResponse(accountRepository.save(account));
    }

    public AccountResponse getAccount(UUID id) {
        return accountRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id));
    }

    public AccountResponse getByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + accountNumber));
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AccountResponse deposit(UUID id, DepositRequest request) {
        Account account = requireActive(id);
        account.setBalance(account.getBalance().add(request.getAmount()));
        Account saved = accountRepository.save(account);
        transactionClient.record(id, null, "DEPOSIT", request.getAmount(),
                account.getCurrency(), request.getDescription(), request.getCategory());
        return toResponse(saved);
    }

    @Transactional
    public AccountResponse withdraw(UUID id, WithdrawRequest request) {
        Account account = requireActive(id);
        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Insufficient funds");
        }
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        Account saved = accountRepository.save(account);
        transactionClient.record(id, null, "WITHDRAWAL", request.getAmount(),
                account.getCurrency(), request.getDescription(), request.getCategory());
        return toResponse(saved);
    }

    @Transactional
    public AccountResponse transfer(UUID sourceId, TransferRequest request) {
        Account source = requireActive(sourceId);
        Account target = accountRepository.findById(request.getTargetAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Target account not found: " + request.getTargetAccountId()));

        if (target.getStatus() == AccountStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Target account is closed");
        }
        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Insufficient funds");
        }

        source.setBalance(source.getBalance().subtract(request.getAmount()));
        target.setBalance(target.getBalance().add(request.getAmount()));
        accountRepository.save(source);
        accountRepository.save(target);

        transactionClient.record(sourceId, request.getTargetAccountId(), "TRANSFER",
                request.getAmount(), source.getCurrency(), request.getDescription(), request.getCategory());
        return toResponse(source);
    }

    @Transactional
    public AccountResponse freeze(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active accounts can be frozen");
        }
        account.setStatus(AccountStatus.FROZEN);
        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse unfreeze(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id));
        if (account.getStatus() != AccountStatus.FROZEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only frozen accounts can be unfrozen");
        }
        account.setStatus(AccountStatus.ACTIVE);
        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse close(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id));
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account is already closed");
        }
        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Cannot close account with non-zero balance");
        }
        account.setStatus(AccountStatus.CLOSED);
        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(UUID id) {
        if (!accountRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id);
        }
        accountRepository.deleteById(id);
    }

    private Account requireActive(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found: " + id));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Account is not active (status: " + account.getStatus() + ")");
        }
        return account;
    }

    private String generateAccountNumber() {
        return "VF" + System.currentTimeMillis();
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .ownerName(account.getOwnerName())
                .accountType(account.getAccountType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
