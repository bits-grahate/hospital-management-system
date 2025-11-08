package com.hospital.billing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI billingServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Billing Service API")
                .description("Billing Management Microservice - Generate bills for completed appointments, compute taxes, handle cancellations")
                .version("v1")
                .contact(new Contact()
                    .name("Hospital Management System")
                    .email("support@hospital.com")))
            .servers(List.of(
                new Server().url("http://localhost:8004").description("Local Development Server"),
                new Server().url("/api/billing").description("Production Server")
            ));
    }
}


