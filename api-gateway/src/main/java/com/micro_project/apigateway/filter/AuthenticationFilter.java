package com.micro_project.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final WebClient.Builder webClientBuilder;

    public AuthenticationFilter(WebClient.Builder webClientBuilder) {
        super(Config.class);
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getPath().toString();
            logger.info("Processing request for path: {}", path);

            // Skip authentication for login and register endpoints
            if (path.contains("/auth/login") || path.contains("/auth/register")) {
                logger.info("Skipping authentication for public endpoint: {}", path);
                return chain.filter(exchange);
            }

            if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                logger.warn("Missing authorization header for path: {}", path);
                return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("Invalid authorization header format for path: {}", path);
                return onError(exchange, "Invalid authorization header", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);
            logger.info("Validating token for path: {}", path);

            // Call user-service to validate token
            String validateTokenUrl = "http://user-service/api/users/validate-token?token=" + token;
            logger.info("Calling user service at: {}", validateTokenUrl);

            return webClientBuilder.build()
                    .get()
                    .uri(validateTokenUrl)
                    .retrieve()
                    .bodyToMono(Boolean.class)
                    .doOnNext(isValid -> logger.info("Token validation result: {}", isValid))
                    .flatMap(isValid -> {
                        if (!isValid) {
                            logger.warn("Invalid token for path: {}", path);
                            return onError(exchange, "Invalid token", HttpStatus.UNAUTHORIZED);
                        }

                        // Get user ID from token
                        String userIdUrl = "http://user-service/api/users/token/user-id?token=" + token;
                        logger.info("Getting user ID at: {}", userIdUrl);

                        return webClientBuilder.build()
                                .get()
                                .uri(userIdUrl)
                                .retrieve()
                                .bodyToMono(Long.class)
                                .doOnNext(userId -> logger.info("Extracted user ID: {}", userId))
                                .flatMap(userId -> {
                                    // Add user ID to request headers
                                    ServerWebExchange modifiedExchange = exchange.mutate()
                                            .request(r -> r.header("X-User-Id", userId.toString()))
                                            .build();

                                    return chain.filter(modifiedExchange);
                                })
                                .onErrorResume(e -> {
                                    logger.error("Error extracting user ID: {}", e.getMessage(), e);
                                    return onError(exchange, "Error processing token: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
                                });
                    })
                    .onErrorResume(e -> {
                        if (e instanceof WebClientResponseException) {
                            WebClientResponseException wcre = (WebClientResponseException) e;
                            logger.error("WebClient error - Status: {}, Body: {}",
                                    wcre.getStatusCode(), wcre.getResponseBodyAsString(), e);
                        } else {
                            logger.error("Error in token validation: {}", e.getMessage(), e);
                        }
                        return onError(exchange, "Error in token validation: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
                    });
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        logger.error("Authentication error: {}", err);
        exchange.getResponse().setStatusCode(httpStatus);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
        // Configuration properties if needed
    }
}