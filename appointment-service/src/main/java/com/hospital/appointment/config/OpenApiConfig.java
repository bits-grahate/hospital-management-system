package com.hospital.appointment.config;

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
    public OpenAPI appointmentServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Appointment Service API")
                .description("Appointment Management Microservice - Book/reschedule/cancel appointments with constraints & slot collision checks")
                .version("v1")
                .contact(new Contact()
                    .name("Hospital Management System")
                    .email("support@hospital.com")))
            .servers(List.of(
                new Server().url("http://localhost:8003").description("Local Development Server"),
                new Server().url("/api/appointment").description("Production Server")
            ));
    }
}


