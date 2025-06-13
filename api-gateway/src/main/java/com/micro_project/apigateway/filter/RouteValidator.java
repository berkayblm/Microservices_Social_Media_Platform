package com.micro_project.apigateway.filter;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    // list of api endpoints that will not go through Filter
    public static final List<String> openAPIEndpoints = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/token",
            "/api/users/validateToken",
            "/eureka"
            );


    public Predicate<ServerHttpRequest> isSecured =
            request -> openAPIEndpoints
                    .stream()
                    .noneMatch(uri -> request
                            .getURI()
                            .getPath()
                            .contains(uri));
}
