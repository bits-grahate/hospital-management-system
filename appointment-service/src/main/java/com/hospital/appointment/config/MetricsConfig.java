package com.hospital.appointment.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {
    
    @Bean
    public Counter appointmentsCreatedCounter(MeterRegistry registry) {
        return Counter.builder("appointments_created_total")
                .description("Total number of appointments created")
                .tag("service", "appointment-service")
                .register(registry);
    }
    
    @Bean
    public Counter appointmentsCancelledCounter(MeterRegistry registry) {
        return Counter.builder("appointments_cancelled_total")
                .description("Total number of appointments cancelled")
                .tag("service", "appointment-service")
                .register(registry);
    }
    
    @Bean
    public Counter appointmentsRescheduledCounter(MeterRegistry registry) {
        return Counter.builder("appointments_rescheduled_total")
                .description("Total number of appointments rescheduled")
                .tag("service", "appointment-service")
                .register(registry);
    }
    
    @Bean
    public Timer appointmentBookingLatency(MeterRegistry registry) {
        return Timer.builder("appointment_booking_latency_ms")
                .description("Appointment booking latency in milliseconds")
                .tag("service", "appointment-service")
                .register(registry);
    }
}


