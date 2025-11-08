package com.hospital.billing.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {
    
    @Bean
    public Counter billsCreatedCounter(MeterRegistry registry) {
        return Counter.builder("bills_created_total")
                .description("Total number of bills created")
                .tag("service", "billing-service")
                .register(registry);
    }
    
    @Bean
    public Timer billCreationLatency(MeterRegistry registry) {
        return Timer.builder("bill_creation_latency_ms")
                .description("Bill creation latency in milliseconds")
                .tag("service", "billing-service")
                .register(registry);
    }
    
    @Bean
    public Counter paymentsFailedCounter(MeterRegistry registry) {
        return Counter.builder("payments_failed_total")
                .description("Total number of failed payments")
                .tag("service", "billing-service")
                .register(registry);
    }
    
    @Bean
    public Counter cancellationFeesChargedCounter(MeterRegistry registry) {
        return Counter.builder("cancellation_fees_charged_total")
                .description("Total number of cancellation fees charged")
                .tag("service", "billing-service")
                .register(registry);
    }
    
    @Bean
    public Counter noShowFeesChargedCounter(MeterRegistry registry) {
        return Counter.builder("no_show_fees_charged_total")
                .description("Total number of no-show fees charged")
                .tag("service", "billing-service")
                .register(registry);
    }
}


