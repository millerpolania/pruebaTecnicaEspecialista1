// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ReactiveHttpClientConfig {

    @Bean
    public WebClient httpClient() {
        return WebClient.builder()
                .filter((request, next) -> {
                    String correlationId = MDC.get("correlationId");
                    ClientRequest filteredRequest = ClientRequest.from(request)
                            .header("X-Correlation-ID", correlationId != null ? correlationId : "internal-orq")
                            .build();
                    return next.exchange(filteredRequest);
                })
                .build();
    }
}