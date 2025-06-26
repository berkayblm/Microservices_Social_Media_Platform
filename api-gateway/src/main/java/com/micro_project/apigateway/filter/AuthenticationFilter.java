package com.micro_project.apigateway.filter;

import com.micro_project.apigateway.dto.UserDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);
    private final RouteValidator routeValidator;
    private final WebClient.Builder webClientBuilder;

    public AuthenticationFilter(RouteValidator routeValidator, WebClient.Builder webClientBuilder) {
        super(Config.class);
        this.routeValidator = routeValidator;
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public GatewayFilter apply(AuthenticationFilter.Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            log.debug("Processing request: {}", request.getURI());

            // Bypass the filter if the request is to an open API endpoint
            if (routeValidator.isSecured.test(request)) {
                log.debug("Request requires authentication");

                // Check if the Authorization header is present
                if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    log.error("Missing authorization header");
                    throw new RuntimeException("Missing authorization information");
                }

                String authHeader = request.getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
                log.debug("Auth header: {}", authHeader);

                String[] parts = authHeader.split(" ");

                if (parts.length != 2 || !"Bearer".equals(parts[0])) {
                    log.error("Incorrect authorization structure: {}", authHeader);
                    throw new RuntimeException("Incorrect authorization structure");
                }

                String token = parts[1];
                log.debug("Validating token: {}", token.substring(0, Math.min(10, token.length())) + "...");

                // Call the identity service to validate the token
                return webClientBuilder.build()
                        .post()
                        .uri("lb://user-service/api/users/validateToken?token=" + token)
                        .retrieve()
                        .bodyToMono(UserDto.class)
                        .doOnNext(userDto -> log.debug("UserDto received: id={}, username={}",
                                userDto.getId(), userDto.getUsername()))
                        .map(userDto -> {
                            ServerHttpRequest mutatedRequest = exchange.getRequest()
                                .mutate()
                                .header("Authorization", request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION))
                                .header("loggedInUser", String.valueOf(userDto.getUsername()))
                                .header("userId", String.valueOf(userDto.getId()))
                                .build();
                            return exchange.mutate().request(mutatedRequest).build();
                        })
                        .flatMap(chain::filter);
            }

            // If the request is to an open API endpoint, skip the filter
            log.debug("Request is to an open endpoint, skipping authentication");
            return chain.filter(exchange);
        };
    }


    public static class Config {
    }
}