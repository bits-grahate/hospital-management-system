# Appointment Service - Microservice Documentation

## Overview

The **Appointment Service** is a microservice responsible for managing appointments in the Hospital Management System. It provides booking, rescheduling, cancellation, and completion functionality with comprehensive business rules and validations.

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
- **Port**: 8003 (default)

### Service Characteristics

- **Microservice**: Independent, isolated service with its own database
- **Database-Per-Service**: Uses dedicated database (`appointmentdb`)
- **RESTful API**: All endpoints follow REST principles
- **API Versioning**: All endpoints use `/v1` prefix
- **Structured Logging**: JSON format with correlation IDs
- **OpenAPI 3.0**: Swagger UI available at `/swagger-ui.html`

---

## Features

### 1. Book Appointment
- Validates patient exists (calls Patient Service)
- Validates doctor exists and checks availability (calls Doctor Service)
- Validates clinic hours (9 AM - 6 PM)
- Validates lead time (minimum 2 hours from now)
- Checks daily cap (max appointments per doctor per day)
- Prevents slot collisions
- Creates appointment with status `SCHEDULED`

### 2. Reschedule Appointment
- Maximum 2 reschedules per appointment
- Must be at least 1 hour before original appointment start
- New slot must be at least 2 hours from now
- Validates clinic hours and availability
- Updates appointment with new slot times
- Increments reschedule count

### 3. Cancel Appointment
- Must be at least 1 hour before appointment start
- Updates status to `CANCELLED`
- Notifies Billing Service for cancellation fee calculation

### 4. Complete Appointment
- Updates status to `COMPLETED`
- Notifies Billing Service to generate bill

### 5. Mark No-Show
- Updates status to `NO_SHOW`
- Notifies Billing Service for no-show fee calculation

### 6. List Appointments
- Paginated listing
- Filter by patient, doctor, status, date range

---

## API Endpoints

### Health Check
```
GET /v1/health
```

### Book Appointment
```
POST /v1/appointments
Content-Type: application/json

{
  "patientId": 1,
  "doctorId": 1,
  "slotStart": "2025-01-15T10:00:00",
  "slotEnd": "2025-01-15T10:30:00"
}
```

### Reschedule Appointment
```
PUT /v1/appointments/{appointmentId}/reschedule
Content-Type: application/json

{
  "newSlotStart": "2025-01-15T14:00:00",
  "newSlotEnd": "2025-01-15T14:30:00"
}
```

### Cancel Appointment
```
PUT /v1/appointments/{appointmentId}/cancel
```

### Complete Appointment
```
PUT /v1/appointments/{appointmentId}/complete
```

### Mark No-Show
```
PUT /v1/appointments/{appointmentId}/no-show
```

### Get Appointment
```
GET /v1/appointments/{appointmentId}
```

### List Appointments
```
GET /v1/appointments?page=1&limit=20&patientId=1&doctorId=1&status=SCHEDULED
```

### Count Appointments by Doctor and Date
```
GET /v1/appointments/doctor/{doctorId}/count?date=2025-01-15T00:00:00
```

---

## Data Model

### Appointment Entity

```java
@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appointmentId;
    
    private Long patientId;  // Reference to Patient Service
    private Long doctorId;    // Reference to Doctor Service
    private String department; // Cached from Doctor Service
    
    private LocalDateTime slotStart;
    private LocalDateTime slotEnd;
    
    @Enumerated(EnumType.STRING)
    private AppointmentStatus status; // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
    
    private Integer rescheduleCount; // Max 2
    private Long version; // Optimistic locking
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Appointment Status Enum

- `SCHEDULED`: Appointment is scheduled
- `COMPLETED`: Appointment was completed
- `CANCELLED`: Appointment was cancelled
- `NO_SHOW`: Patient did not show up

---

## Business Rules

### Booking Rules
1. **Clinic Hours**: Appointments must be between 9 AM and 6 PM
2. **Lead Time**: Appointments must be at least 2 hours from current time
3. **Daily Cap**: Maximum 20 appointments per doctor per day (configurable)
4. **Slot Collision**: No overlapping appointments for the same doctor
5. **Patient Validation**: Patient must exist in Patient Service
6. **Doctor Validation**: Doctor must exist and be available in Doctor Service

### Rescheduling Rules
1. **Maximum Reschedules**: Maximum 2 reschedules per appointment
2. **Cut-off Time**: Must reschedule at least 1 hour before original appointment start
3. **New Slot Lead Time**: New slot must be at least 2 hours from now
4. **Clinic Hours**: New slot must be within clinic hours
5. **Availability**: New slot must be available (no collisions)

### Cancellation Rules
1. **Cut-off Time**: Must cancel at least 1 hour before appointment start
2. **Billing**: Billing Service calculates cancellation fee based on timing

### No-Show Rules
1. **Billing**: Billing Service calculates no-show fee

---

## Inter-Service Communication

### Patient Service
- **GET** `/v1/patients/{patientId}` - Validate patient exists

### Doctor Service
- **GET** `/v1/doctors/{doctorId}` - Validate doctor exists
- **POST** `/v1/doctors/{doctorId}/check-availability` - Check slot availability

### Billing Service
- **POST** `/v1/billing-events` - Notify billing events:
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
- `BOOKING_FAILED`: Booking validation failed
- `RESCHEDULE_FAILED`: Rescheduling validation failed
- `CANCEL_FAILED`: Cancellation validation failed
- `NOT_FOUND`: Appointment not found
- `VALIDATION_ERROR`: Input validation error

---

## Database

### Database Configuration
- **Local**: H2 in-memory database (`h2:mem:appointmentdb`)
- **Production**: PostgreSQL
- **Connection**: JDBC URL via `DATABASE_URL` environment variable

### H2 Console Access
- **URL**: `http://localhost:8003/h2-console`
- **JDBC URL**: `jdbc:h2:mem:appointmentdb`
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
  "service": "appointment-service",
  "port": 8003,
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
    "appointments_created_total": "Counter - Total appointments created",
    "appointments_cancelled_total": "Counter - Total appointments cancelled",
    "appointments_rescheduled_total": "Counter - Total appointments rescheduled",
    "appointment_booking_latency_ms": "Timer - Booking latency in milliseconds"
  },
  "logging": {
    "format": "JSON",
    "correlationId": "enabled"
  },
  "availableEndpoints": {
    "GET": "/v1/appointments, /v1/appointments/{id}, /v1/appointments/doctor/{doctorId}/count",
    "POST": "/v1/appointments",
    "PUT": "/v1/appointments/{id}/reschedule, /v1/appointments/{id}/cancel, /v1/appointments/{id}/complete, /v1/appointments/{id}/no-show"
  }
}
```

### Actuator Endpoints
- `/actuator/health` - Detailed health status
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics
- `/actuator/info` - Service information

### Metrics
- Custom metrics for appointment operations
- Correlation IDs in all logs
- Structured JSON logging

---

## ER Diagram

```
┌─────────────────────────────────────┐
│      APPOINTMENTS Table             │
├─────────────────────────────────────┤
│ PK │ appointment_id   │ BIGINT      │
│    │ patient_id       │ BIGINT      │  ───┐
│    │ doctor_id       │ BIGINT      │  ───┤  External References
│    │ department       │ VARCHAR     │  ───┤  (No actual FK constraint)
│    │ slot_start       │ TIMESTAMP   │     │
│    │ slot_end         │ TIMESTAMP   │     │
│    │ status           │ ENUM        │     │
│    │ reschedule_count │ INTEGER     │     │
│    │ version          │ BIGINT      │     │
│    │ created_at       │ TIMESTAMP   │     │
│    │ updated_at       │ TIMESTAMP   │     │
└─────────────────────────────────────┘

Ownership: Appointment Service owns appointment lifecycle
Relationships: 
  - patient_id references Patient Service (via REST API)
  - doctor_id references Doctor Service (via REST API)
  - department cached locally for reporting
```

---

## Docker Deployment

### 🚀 Quick Start with Docker Compose

**📍 Run all commands from the project root directory:**
```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Start Appointment Service:**
```bash
# Build and start the service
docker-compose build appointment-service
docker-compose up -d appointment-service

# Or rebuild (no cache) and start
docker-compose build --no-cache appointment-service
docker-compose up -d appointment-service
```

**Start all services (including dependencies):**
```bash
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
docker-compose logs -f appointment-service
```

**Verify service is running:**
```bash
curl http://localhost:8003/v1/health
```

**Restart service:**
```bash
docker-compose restart appointment-service
```

**Stop service:**
```bash
docker-compose stop appointment-service
# Or stop all services
docker-compose down
```

**Rebuild and restart (complete refresh):**
```bash
docker-compose build --no-cache appointment-service && docker-compose up -d appointment-service
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
EXPOSE 8003
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose
```yaml
appointment-service:
  build: ./appointment-service
  ports:
    - "8003:8003"
  environment:
    - PORT=8003
    - DATABASE_URL=h2:mem:appointmentdb
    - PATIENT_SERVICE_URL=http://patient-service:8001
    - DOCTOR_SERVICE_URL=http://doctor-service:8002
    - BILLING_SERVICE_URL=http://billing-service:8004
```

---

## OpenAPI Documentation

### Swagger UI
- **URL**: `http://localhost:8003/swagger-ui.html`
- **API Docs**: `http://localhost:8003/v3/api-docs`

### OpenAPI Configuration
- SpringDoc OpenAPI 2.2.0
- Auto-generated from controller annotations
- Interactive API testing interface

---

## Summary

The Appointment Service is a core microservice that manages the complete appointment lifecycle with comprehensive business rules, validations, and inter-service communication. It ensures data consistency through optimistic locking and maintains isolation through the database-per-service pattern.


