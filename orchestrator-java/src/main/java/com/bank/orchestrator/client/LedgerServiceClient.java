// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.client;

import com.bank.orchestrator.dto.AccountBalanceResponse;
import com.bank.orchestrator.dto.FundsTransferRequest;
import com.bank.orchestrator.dto.TransactionRecordResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import java.util.Map;

@Component
public class LedgerServiceClient {

    private final WebClient httpClient;
    private final String ledgerServiceUrl;

    public LedgerServiceClient(WebClient httpClient, @Value("${services.core-url}") String ledgerServiceUrl) {
        this.httpClient = httpClient;
        this.ledgerServiceUrl = ledgerServiceUrl;
    }

    public Mono<AccountBalanceResponse> getBalance(Long userId) {
        return this.httpClient.post()
                .uri(ledgerServiceUrl + "/core2/balance")
                .bodyValue(Map.of("userId", userId))
                .retrieve()
                .bodyToMono(AccountBalanceResponse.class);
    }

    public Flux<TransactionRecordResponse> getMovements(Long userId) {
        return this.httpClient.post()
                .uri(ledgerServiceUrl + "/core2/movements")
                .bodyValue(Map.of("userId", userId))
                .retrieve()
                .bodyToFlux(TransactionRecordResponse.class);
    }

    public Mono<String> executeTransfer(FundsTransferRequest request) {
        return this.httpClient.post()
                .uri(ledgerServiceUrl + "/core3/transfers")
                .bodyValue(request) 
                .retrieve()
                .bodyToMono(String.class);
    }
}