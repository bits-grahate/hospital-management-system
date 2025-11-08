# Billing Service - Microservice Documentation

## Overview

The **Billing Service** is a microservice responsible for managing billing operations in the Hospital Management System. It generates bills for completed appointments, computes taxes, handles cancellations, and processes refunds.

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Data Model](#data-model)
5. [Business Rules](#business-rules)
6. [Inter-Service Communication](#inter-service-communication)
7. [Error Handling](#error-handling)
8. [Database](#database)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [ER Diagram](#er-diagram)
11. [Docker Deployment](#docker-deployment)
12. [OpenAPI Documentation](#openapi-documentation)

---

## Service Architecture

### Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (in-memory for local) / PostgreSQL (for production)
- **Build Tool**: Maven
- **Port**: 8004 (default)

### Service Characteristics

- **Microservice**: Independent, isolated service with its own database
- **Database-Per-Service**: Uses dedicated database (`billingdb`)
- **RESTful API**: All endpoints follow REST principles
- **API Versioning**: All endpoints use `/v1` prefix
- **Structured Logging**: JSON format with correlation IDs
- **OpenAPI 3.0**: Swagger UI available at `/swagger-ui.html`
- **CORS Enabled**: Supports cross-origin requests from frontend

---

## Features

### 1. Generate Bill for Completed Appointments
- Automatically triggered when appointment is completed
- Calculates consultation fee (₹500.00)
- Estimates medication fee (₹200.00)
- Computes tax (5% on subtotal)
- Creates bill with status `OPEN`

### 2. Handle Cancellation Fees
- Full refund if cancelled >2 hours before appointment
- 50% cancellation fee if cancelled ≤2 hours before appointment
- Updates bill status to `REFUNDED` with refund amount and reason

### 3. Handle No-Show Fees
- Charges full consultation fee
- Updates bill status to `PAID`

### 4. Mark Bill as Paid
- Updates bill status from `OPEN` to `PAID`
- Records payment timestamp

### 5. Process Refunds
- Calculates refund amount
- Updates bill status to `REFUNDED`
- Records refund reason

### 6. List Bills
- Paginated listing of all bills
- Filter by patient ID
- Search by patient name (via Patient Service integration)

---

## API Endpoints

### Health Check
```
GET /v1/health
```

### Process Billing Event
```
POST /v1/billing-events
Content-Type: application/json

{
  "eventType": "APPOINTMENT_COMPLETED",
  "appointmentId": 1,
  "patientId": 1,
  "doctorId": 1
}
```

### Get Bill by ID
```
GET /v1/bills/{billId}
```

### Get All Bills (Paginated)
```
GET /v1/bills?page=1&limit=20
```

### Get Bills by Patient
```
GET /v1/bills/patient/{patientId}?page=1&limit=20
```

### Mark Bill as Paid
```
PUT /v1/bills/{billId}/mark-paid
```

### Process Refund
```
PUT /v1/bills/{billId}/refund
Content-Type: application/json

{
  "refundAmount": 250.00,
  "reason": "Cancellation within 2 hours"
}
```

### Void Bill
```
PUT /v1/bills/{billId}/void
```

---

## Data Model

### Bill Entity

```java
@Entity
@Table(name = "bills")
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long billId;
    
    private Long patientId;      // Reference to Patient Service
    private Long appointmentId;  // Reference to Appointment Service
    
    @Column(precision = 10, scale = 2)
    private BigDecimal consultationFee; // ₹500.00
    
    @Column(precision = 10, scale = 2)
    private BigDecimal medicationFee;   // ₹200.00 (estimated)
    
    @Column(precision = 10, scale = 2)
    private BigDecimal taxAmount;      // 5% of subtotal
    
    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;
    
    private String refundReason;
    
    @Enumerated(EnumType.STRING)
    private BillStatus status; // OPEN, PAID, VOID, REFUNDED
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Bill Status Enum

- `OPEN`: Bill created, awaiting payment
- `PAID`: Bill has been paid
- `VOID`: Bill has been voided
- `REFUNDED`: Bill has been refunded

---

## Business Rules

### Bill Generation Rules
1. **Consultation Fee**: Fixed at ₹500.00
2. **Medication Fee**: Estimated at ₹200.00 (may vary in final bill)
3. **Tax Calculation**: 5% of subtotal (consultation + medication)
4. **Total Amount**: Consultation + Medication + Tax

### Cancellation Fee Rules
1. **Full Refund**: If cancelled >2 hours before appointment start
2. **50% Fee**: If cancelled ≤2 hours before appointment start
3. **Refund Amount**: Calculated based on timing
4. **Refund Reason**: Automatically set based on cancellation timing

### No-Show Fee Rules
1. **Full Fee**: Patient charged full consultation fee
2. **Status**: Bill marked as `PAID` automatically

### Payment Rules
1. **Status Transition**: `OPEN` → `PAID`
2. **Timestamp**: Payment timestamp recorded

### Refund Rules
1. **Status Transition**: `PAID` → `REFUNDED`
2. **Refund Amount**: Must be ≤ total amount
3. **Refund Reason**: Required for audit trail

---

## Inter-Service Communication

### Patient Service
- **GET** `/v1/patients/{patientId}` - Validate patient exists
- **GET** `/v1/patients?name={name}` - Search patients by name

### Appointment Service
- **GET** `/v1/appointments/{appointmentId}` - Get appointment details
- **GET** `/v1/appointments/{appointmentId}/slot-start` - Get appointment slot start time

### Billing Events
The service listens to billing events from Appointment Service:
- `APPOINTMENT_COMPLETED` - Generate bill
- `APPOINTMENT_CANCELLED` - Calculate cancellation fee
- `APPOINTMENT_NO_SHOW` - Calculate no-show fee

---

## Error Handling

### Error Response Format
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "correlationId": "uuid"
}
```

### Common Error Codes
- `BILL_NOT_FOUND`: Bill does not exist
- `INVALID_STATUS`: Invalid bill status for operation
- `REFUND_EXCEEDS_AMOUNT`: Refund amount exceeds bill total
- `VALIDATION_ERROR`: Input validation error

---

## Database

### Database Configuration
- **Local**: H2 in-memory database (`h2:mem:billingdb`)
- **Production**: PostgreSQL
- **Connection**: JDBC URL via `DATABASE_URL` environment variable

### H2 Console Access
- **URL**: `http://localhost:8004/h2-console`
- **JDBC URL**: `jdbc:h2:mem:billingdb`
- **Username**: `sa`
- **Password**: (empty)

---

## Monitoring & Health Checks

### Health Endpoint

**GET** `/v1/health`

Returns enhanced service health status with comprehensive information about endpoints, monitoring, custom metrics, logging, and available APIs.

**Response:**
```json
{
  "status": "healthy",
  "service": "billing-service",
  "port": 8004,
  "endpoints": {
    "api": "/v1",
    "swagger": "/swagger-ui.html",
    "swaggerAlt": "/swagger-ui/index.html",
    "apiDocs": "/v3/api-docs",
    "h2Console": "/h2-console"
  },
  "monitoring": {
    "health": "/actuator/health",
    "metrics": "/actuator/metrics",
    "prometheus": "/actuator/prometheus",
    "info": "/actuator/info"
  },
  "customMetrics": {
    "bills_created_total": "Counter - Total bills created",
    "bill_creation_latency_ms": "Timer - Bill creation latency in milliseconds",
    "cancellation_fees_charged_total": "Counter - Total cancellation fees charged",
    "no_show_fees_charged_total": "Counter - Total no-show fees charged",
    "payments_failed_total": "Counter - Total failed payments"
  },
  "logging": {
    "format": "JSON",
    "correlationId": "enabled"
  },
  "availableEndpoints": {
    "GET": "/v1/bills, /v1/bills/{id}, /v1/bills/patient/{patientId}",
    "POST": "/v1/billing-events, /v1/bills/{id}/refund",
    "PUT": "/v1/bills/{id}/void, /v1/bills/{id}/paid"
  }
}
```

### Actuator Endpoints
- `/actuator/health` - Detailed health status
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics
- `/actuator/info` - Service information

### Metrics
- Custom metrics for billing operations
- Correlation IDs in all logs
- Structured JSON logging

---

## ER Diagram

```
┌─────────────────────────────────────┐
│          BILLS Table                │
├─────────────────────────────────────┤
│ PK │ bill_id          │ BIGINT      │
│    │ patient_id       │ BIGINT      │  ───┐
│    │ appointment_id   │ BIGINT      │  ───┤  External References
│    │ consultation_fee │ DECIMAL     │     │  (No actual FK constraint)
│    │ medication_fee   │ DECIMAL     │     │
│    │ tax_amount       │ DECIMAL     │     │
│    │ total_amount     │ DECIMAL     │     │
│    │ refund_amount    │ DECIMAL     │     │
│    │ refund_reason    │ VARCHAR     │     │
│    │ status           │ ENUM        │     │
│    │ created_at       │ TIMESTAMP   │     │
│    │ updated_at       │ TIMESTAMP   │     │
└─────────────────────────────────────┘

Ownership: Billing Service owns all billing data
Relationships:
  - patient_id references Patient Service (via REST API)
  - appointment_id references Appointment Service (via REST API)
```

---

## Docker Deployment

### 🚀 Quick Start with Docker Compose

**📍 Run all commands from the project root directory:**
```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Start Billing Service:**
```bash
# Build and start the service
docker-compose build billing-service
docker-compose up -d billing-service

# Or rebuild (no cache) and start
docker-compose build --no-cache billing-service
docker-compose up -d billing-service
```

**Start all services (including dependencies):**
```bash
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
docker-compose logs -f billing-service
```

**Verify service is running:**
```bash
curl http://localhost:8004/v1/health
```

**Restart service:**
```bash
docker-compose restart billing-service
```

**Stop service:**
```bash
docker-compose stop billing-service
# Or stop all services
docker-compose down
```

**Rebuild and restart (complete refresh):**
```bash
docker-compose build --no-cache billing-service && docker-compose up -d billing-service
```

---

### Dockerfile
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8004
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose
```yaml
billing-service:
  build: ./billing-service
  ports:
    - "8004:8004"
  environment:
    - PORT=8004
    - DATABASE_URL=h2:mem:billingdb
    - PATIENT_SERVICE_URL=http://patient-service:8001
    - APPOINTMENT_SERVICE_URL=http://appointment-service:8003
```

---

## OpenAPI Documentation

### Swagger UI
- **URL**: `http://localhost:8004/swagger-ui.html`
- **API Docs**: `http://localhost:8004/v3/api-docs`

### OpenAPI Configuration
- SpringDoc OpenAPI 2.2.0
- Auto-generated from controller annotations
- Interactive API testing interface

---

## Summary

The Billing Service is a critical microservice that manages all billing operations, including bill generation, tax computation, cancellation fees, and refunds. It integrates with Patient and Appointment services to provide comprehensive billing functionality while maintaining data isolation through the database-per-service pattern.


