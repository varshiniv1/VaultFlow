package com.vaultflow.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import java.util.function.Function;

@Configuration
public class GatewayConfig {

    @Value("${services.accounts.url:http://localhost:8081}")
    private String accountsUrl;

    @Value("${services.transactions.url:http://localhost:8082}")
    private String transactionsUrl;

    @Value("${services.notifications.url:http://localhost:8083}")
    private String notificationsUrl;

    @Value("${services.fraud.url:http://localhost:8084}")
    private String fraudUrl;

    @Bean
    public RouterFunction<ServerResponse> accountsRoute() {
        return GatewayRouterFunctions.route("accounts-route")
                .route(RequestPredicates.path("/api/accounts/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri(accountsUrl))
                .before(propagateUserId())
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> transactionsRoute() {
        return GatewayRouterFunctions.route("transactions-route")
                .route(RequestPredicates.path("/api/transactions/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri(transactionsUrl))
                .before(propagateUserId())
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> notificationsRoute() {
        return GatewayRouterFunctions.route("notifications-route")
                .route(RequestPredicates.path("/api/notifications/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri(notificationsUrl))
                .before(propagateUserId())
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> fraudRoute() {
        return GatewayRouterFunctions.route("fraud-route")
                .route(RequestPredicates.path("/api/fraud/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri(fraudUrl))
                .before(propagateUserId())
                .build();
    }

    private static Function<ServerRequest, ServerRequest> propagateUserId() {
        return req -> {
            Object userId = req.servletRequest().getAttribute("X-User-Id");
            if (userId != null) {
                return ServerRequest.from(req).header("X-User-Id", userId.toString()).build();
            }
            return req;
        };
    }
}
