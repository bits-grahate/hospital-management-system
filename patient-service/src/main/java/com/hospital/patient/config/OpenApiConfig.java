package com.hospital.patient.config;

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
    public OpenAPI patientServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Patient Service API")
                .description("Patient Management Microservice - CRUD operations, search by name/phone, PII masking in logs")
                .version("v1")
                .contact(new Contact()
                    .name("Hospital Management System")
                    .email("support@hospital.com")))
            .servers(List.of(
                new Server().url("http://localhost:8001").description("Local Development Server"),
                new Server().url("/api/patient").description("Production Server")
            ));
    }
}


