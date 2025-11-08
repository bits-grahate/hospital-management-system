package com.hospital.doctor.config;

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
    public OpenAPI doctorServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Doctor & Scheduling Service API")
                .description("Doctor & Scheduling Management Microservice - Doctors listing, department filter, slot availability checks")
                .version("v1")
                .contact(new Contact()
                    .name("Hospital Management System")
                    .email("support@hospital.com")))
            .servers(List.of(
                new Server().url("http://localhost:8002").description("Local Development Server"),
                new Server().url("/api/doctor").description("Production Server")
            ));
    }
}


