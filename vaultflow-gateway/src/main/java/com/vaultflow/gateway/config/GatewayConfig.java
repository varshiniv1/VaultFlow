package com.vaultflow.gateway.config;

import org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

@Configuration
public class GatewayConfig {

    @Bean
    public RouterFunction<ServerResponse> accountsRoute() {
        return GatewayRouterFunctions.route("accounts-route")
                .route(RequestPredicates.path("/api/accounts/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri("http://localhost:8081"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> transactionsRoute() {
        return GatewayRouterFunctions.route("transactions-route")
                .route(RequestPredicates.path("/api/transactions/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri("http://localhost:8082"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> notificationsRoute() {
        return GatewayRouterFunctions.route("notifications-route")
                .route(RequestPredicates.path("/api/notifications/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri("http://localhost:8083"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> fraudRoute() {
        return GatewayRouterFunctions.route("fraud-route")
                .route(RequestPredicates.path("/api/fraud/**"), HandlerFunctions.http())
                .before(BeforeFilterFunctions.uri("http://localhost:8084"))
                .build();
    }
}
