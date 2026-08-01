// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.controller; 

import com.bank.orchestrator.client.IdentityServiceClient;
import com.bank.orchestrator.client.LedgerServiceClient;
import com.bank.orchestrator.dto.AccountBalanceResponse;
import com.bank.orchestrator.dto.TransactionRecordResponse;
import com.bank.orchestrator.dto.FundsTransferRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orchestrator")
@Tag(name = "Bank Gateway Financial API", description = "Endpoints controlados y orquestados para la Fintech políglota")
public class BankGatewayController {

    private final LedgerServiceClient ledgerClient;
    private final IdentityServiceClient identityClient;

    public BankGatewayController(LedgerServiceClient ledgerClient, IdentityServiceClient identityClient) {
        this.ledgerClient = ledgerClient;
        this.identityClient = identityClient;
    }

    @GetMapping("/accounts/balance/{userId}")
    @Operation(summary = "Consulta de saldo segura orquestada hacia Core")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "balanceFallback")
    public Mono<ResponseEntity<AccountBalanceResponse>> getOrchestratedBalance(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) {
        
        long requestStartedAt = System.currentTimeMillis();
        String operationName = "GET /api/v1/orchestrator/accounts/balance/" + userId;
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        StructuredLogWriter.info("Procesando consulta de saldo orquestada para el usuario ID: " + userId, traceId, "N/A", operationName, null, 200);
        
        return identityClient.validateSession(token)
                .flatMap(session -> ledgerClient.getBalance(userId))
                .map(res -> {
                    long elapsedMillis = System.currentTimeMillis() - requestStartedAt;
                    StructuredLogWriter.info("Consulta de saldo completada con éxito", traceId, "N/A", operationName, elapsedMillis, 200);
                    return ResponseEntity.ok(res);
                });
    }

    @PostMapping("/transfers")
    @Operation(summary = "Ejecución transaccional de transferencias por teléfono con protección Circuit Breaker y token Redis")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "transferFallback")
    public Mono<ResponseEntity<String>> executeOrchestratedTransfer(
            @RequestHeader("Authorization") String token,
            @RequestBody FundsTransferRequest request,
            HttpServletRequest servletRequest) {
        
        long requestStartedAt = System.currentTimeMillis();
        String operationName = "POST /api/v1/orchestrator/transfers";
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        StructuredLogWriter.info("Iniciando flujo de orquestación de transferencia", traceId, "N/A", operationName, null, 200);
        
        return identityClient.validateSession(token)
                .flatMap(session -> {
                    String username = session instanceof Map ? String.valueOf(((Map<?,?>)session).get("username")) : "N/A";
                    StructuredLogWriter.info("Sesión validada exitosamente en Redis para usuario: " + username + ". Procediendo a la transferencia física en BD.", traceId, username, operationName, null, 200);
                    return ledgerClient.executeTransfer(request);
                })
                .map(res -> {
                    long elapsedMillis = System.currentTimeMillis() - requestStartedAt;
                    StructuredLogWriter.info("Transferencia orquestada y completada de forma exitosa", traceId, "N/A", operationName, elapsedMillis, 201);
                    return ResponseEntity.status(HttpStatus.CREATED).body(res);
                });
    }

    @GetMapping("/movements/{userId}")
    @Operation(summary = "Consulta de movimientos histórica orquestada mediante GET")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "movementsFallback")
    public Mono<ResponseEntity<List<TransactionRecordResponse>>> getOrchestratedMovements(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) {
        
        long requestStartedAt = System.currentTimeMillis();
        String operationName = "GET /api/v1/orchestrator/movements/" + userId;
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        StructuredLogWriter.info("Orquestando la consulta GET de movimientos para el usuario ID: " + userId, traceId, "N/A", operationName, null, 200);
        
        return identityClient.validateSession(token)
                .flatMapMany(session -> ledgerClient.getMovements(userId)) 
                .collectList()
                .map(res -> {
                    long elapsedMillis = System.currentTimeMillis() - requestStartedAt;
                    StructuredLogWriter.info("Consulta de movimientos completada exitosamente. Registros: " + res.size(), traceId, "N/A", operationName, elapsedMillis, 200);
                    return ResponseEntity.ok(res);
                });
    }
    
    @GetMapping("/notifications/{userId}")
    @Operation(summary = "Historial de alertas de movimientos procesado localmente en Java")
    public Mono<ResponseEntity<List<String>>> getLocalNotifications(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) {
        
        long requestStartedAt = System.currentTimeMillis();
        String operationName = "GET /api/v1/orchestrator/notifications/" + userId;
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        StructuredLogWriter.info("Iniciando generación local de notificaciones en Java para el usuario ID: " + userId, traceId, "N/A", operationName, null, 200);
        
        return identityClient.validateSession(token)
                .flatMap(session -> {
                    String username = session instanceof Map ? String.valueOf(((Map<?,?>)session).get("username")) : "Usuario";
                    
                    List<String> localNotifications = List.of(
                        "¡Hola! Tu transferencia por teléfono se ejecutó con éxito.",
                        "Alerta de Seguridad: Inicio de sesión aprobado desde la IP del cliente.",
                        "Tu saldo ha sido actualizado de forma segura."
                    );
                    
                    long elapsedMillis = System.currentTimeMillis() - requestStartedAt;
                    StructuredLogWriter.info("Notificaciones locales generadas exitosamente en Java. Total: " + localNotifications.size(), traceId, username, operationName, elapsedMillis, 200);
                    
                    return Mono.just(ResponseEntity.ok(localNotifications));
                })
                .onErrorResume(ex -> {
                    StructuredLogWriter.error("Fallo al validar sesión para notificaciones locales. Detalle: " + ex.getMessage(), 
                                     traceId, "N/A", operationName, 401, "AUTH_VALIDATION_FAILED");
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of("Error: No autorizado para ver notificaciones.")));
                });
    }

    // ========== MÉTODOS FALLBACK DEL CIRCUIT BREAKER ==========
    
    public Mono<ResponseEntity<AccountBalanceResponse>> balanceFallback(String token, Long userId, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        StructuredLogWriter.error("CIRCUIT BREAKER ACTIVADO - Fallback de Consulta de Saldo. Detalle: " + ex.getMessage(), traceId, "N/A", "GET /api/v1/orchestrator/accounts/balance/" + userId, 503, "ERR_CIRCUIT_BREAKER");
        
        AccountBalanceResponse fallbackResponse = new AccountBalanceResponse();
        fallbackResponse.setAccountId(-1L);
        fallbackResponse.setBalance(0.0);
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(fallbackResponse));
    }

    public Mono<ResponseEntity<String>> transferFallback(String token, FundsTransferRequest request, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        StructuredLogWriter.error("CIRCUIT BREAKER ACTIVADO - Microservicio Core (Python) caído. Bloqueando transferencia.", traceId, "N/A", "POST /api/v1/orchestrator/transfers", 503, "ERR_CIRCUIT_BREAKER");
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Servicio transaccional temporalmente no disponible (Circuit Breaker Abierto)"));
    }

    public Mono<ResponseEntity<List<TransactionRecordResponse>>> movementsFallback(String token, Long userId, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        StructuredLogWriter.error("CIRCUIT BREAKER ACTIVADO - Fallback de Consulta de Movimientos. Detalle: " + ex.getMessage(), traceId, "N/A", "GET /api/v1/orchestrator/movements/" + userId, 503, "ERR_CIRCUIT_BREAKER");
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(List.of()));
    }

    // =====================================================================
    // 📊 CLASE UTILITARIA INTERNA BLINDADA
    // =====================================================================
    private static class StructuredLogWriter {
        private static final Logger structuredLogger = LoggerFactory.getLogger("JSON_STRUCTURED_LOGGER");

        public static void info(String message, String traceId, String sessionId, String operationName, Long durationMs, Integer httpStatus) {
            structuredLogger.info(buildJson("INFO", message, traceId, sessionId, operationName, durationMs, httpStatus, "null"));
        }

        public static void error(String message, String traceId, String sessionId, String operationName, Integer httpStatus, String errorCode) {
            structuredLogger.error(buildJson("ERROR", message, traceId, sessionId, operationName, null, httpStatus, errorCode));
        }

        private static String buildJson(String level, String message, String traceId, String sessionId, String operationName, Long durationMs, Integer httpStatus, String errorCode) {
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"timestamp\":\"").append(Instant.now().toString()).append("\",");
            json.append("\"level\":\"").append(level).append("\",");
            json.append("\"service\":\"orchestrator-service-java\",");
            json.append("\"traceId\":\"").append(traceId != null ? traceId : "internal-orchestrator").append("\",");
            json.append("\"sessionId\":\"").append(sessionId != null ? sessionId : "N/A").append("\",");
            json.append("\"operationName\":\"").append(operationName != null ? operationName : "INTERNAL").append("\",");
            json.append("\"message\":\"").append(message.replace("\"", "\\\"")).append("\",");
            json.append("\"status\":\"").append("ERROR".equals(level) ? "FAILED" : "SUCCESS").append("\",");
            json.append("\"durationMs\":").append(durationMs != null ? durationMs : "null").append(",");
            json.append("\"httpStatus\":").append(httpStatus != null ? httpStatus : "null").append(",");
            json.append("\"errorCode\":").append(errorCode != null && !"null".equals(errorCode) ? "\"" + errorCode + "\"" : "null");
            json.append("}");
            return json.toString();
        }
    }
}