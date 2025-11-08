# Patient Service - Microservice Documentation

## Overview

The **Patient Service** is a microservice responsible for managing patient records in the Hospital Management System. It provides complete CRUD operations, search functionality, and implements **PII (Personally Identifiable Information) masking** in logs for security compliance.

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [PII Masking Implementation](#pii-masking-implementation)
5. [Data Model](#data-model)
6. [Error Handling](#error-handling)
7. [Pagination](#pagination)
8. [Database](#database)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [ER Diagram](#er-diagram)
11. [H2 Database Access](#h2-database-access)
12. [Docker Deployment](#docker-deployment)
13. [Testing](#testing)

---

## Service Architecture

### Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (in-memory for local) / PostgreSQL (for production)
- **Build Tool**: Maven
- **Port**: 8001 (default)

### Service Characteristics

- **Microservice**: Independent, isolated service with its own database
- **Database-Per-Service**: Uses dedicated database (`patientdb`)
- **RESTful API**: All endpoints follow REST principles
- **API Versioning**: All endpoints use `/v1` prefix
- **Structured Logging**: JSON format with correlation IDs
- **PII Protection**: Automatic masking of sensitive data in logs

---

## Features

### 1. CRUD Operations

- ✅ **Create**: Add new patients with validation
- ✅ **Read**: Get patient by ID or list/search with pagination
- ✅ **Update**: Modify existing patient records
- ✅ **Delete**: Hard delete (permanently removes from database)

### 2. Search Functionality

- ✅ **Search by Name**: Case-insensitive partial match
- ✅ **Search by Phone**: Partial match on phone number
- ✅ **Combined Search**: Search by both name and phone simultaneously
- ✅ **Pagination**: All list/search endpoints support pagination

### 3. PII Masking in Logs

- ✅ **Email Masking**: Shows first 2 characters + `***@domain.com`
- ✅ **Phone Masking**: Shows first 2 and last 2 characters with `***` in between
- ✅ **Automatic**: Applied automatically in all log statements
- ✅ **Compliance**: Meets security requirements for sensitive data protection

---

## API Endpoints

### Base URL

```
http://localhost:8001/v1
```

### Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "patient-service"
}
```

---

### Create Patient

**POST** `/patients`

Create a new patient record.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "dob": "1990-01-15"
}
```

**Response:** `201 Created`
```json
{
  "patientId": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "dob": "1990-01-15",
  "createdAt": "2025-11-02T10:30:00",
  "active": true
}
```

**Error Responses:**
- `400 Bad Request`: Email already exists
  ```json
  {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already exists",
    "correlationId": "uuid-here"
  }
  ```

---

### Get Patient by ID

**GET** `/patients/{patientId}`

Retrieve a specific patient by their ID.

**Path Parameters:**
- `patientId` (Long): Patient ID

**Response:** `200 OK`
```json
{
  "patientId": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "dob": "1990-01-15",
  "createdAt": "2025-11-02T10:30:00",
  "active": true
}
```

**Error Responses:**
- `404 Not Found`: Patient not found
  ```json
  {
    "code": "NOT_FOUND",
    "message": "Patient not found",
    "correlationId": "uuid-here"
  }
  ```

---

### Search/List Patients

**GET** `/patients`

Search or list patients with optional filters and pagination.

**Query Parameters:**
- `name` (String, optional): Search by name (case-insensitive, partial match)
- `phone` (String, optional): Search by phone (partial match)
- `page` (Integer, optional, default: 1): Page number (1-based)
- `limit` (Integer, optional, default: 20): Number of records per page

**Examples:**
```
GET /v1/patients                           # List all patients
GET /v1/patients?name=John                # Search by name
GET /v1/patients?phone=555                # Search by phone
GET /v1/patients?name=John&phone=555      # Combined search
GET /v1/patients?page=2&limit=10         # Pagination
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "patientId": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "5551234567",
      "dob": "1990-01-15",
      "createdAt": "2025-11-02T10:30:00",
      "active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 60,
    "totalPages": 3
  }
}
```

---

### Update Patient

**PUT** `/patients/{patientId}`

Update an existing patient record.

**Path Parameters:**
- `patientId` (Long): Patient ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.doe@example.com",
  "phone": "5559876543",
  "dob": "1990-01-15"
}
```

**Response:** `200 OK`
```json
{
  "patientId": 1,
  "name": "John Doe Updated",
  "email": "john.doe@example.com",
  "phone": "5559876543",
  "dob": "1990-01-15",
  "createdAt": "2025-11-02T10:30:00",
  "active": true
}
```

**Error Responses:**
- `404 Not Found`: Patient not found
- `400 Bad Request`: Email already exists (if email is changed)

---

### Delete Patient

**DELETE** `/patients/{patientId}`

Permanently delete a patient record (hard delete).

**Path Parameters:**
- `patientId` (Long): Patient ID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found`: Patient not found
  ```json
  {
    "code": "NOT_FOUND",
    "message": "Patient not found",
    "correlationId": "uuid-here"
  }
  ```

**Note:** This is a **hard delete** operation. The patient record is permanently removed from the database.

---

## PII Masking Implementation

### Overview

The Patient Service implements automatic PII masking in all log statements to protect sensitive patient information while maintaining auditability.

### Masking Rules

#### Email Masking

**Format:** First 2 characters + `***@` + domain

**Examples:**
- `john.doe@example.com` → `jo***@example.com`
- `a@test.com` → `***@test.com`
- `ab@test.com` → `ab***@test.com`

#### Phone Masking

**Format:** First 2 characters + `***` + last 2 characters

**Examples:**
- `5551234567` → `55***67`
- `1234` → `***` (if length ≤ 4)

### Implementation Details

#### Code Location

The PII masking is implemented in `PatientService.java`:

```java
public String maskPII(String value) {
    if (value == null || value.isEmpty()) {
        return value;
    }
    if (value.contains("@")) { // Email
        String[] parts = value.split("@");
        if (parts[0].length() > 2) {
            return parts[0].substring(0, 2) + "***@" + parts[1];
        }
        return "***@" + parts[1];
    } else if (value.length() > 4) { // Phone
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }
    return "***";
}
```

#### Usage in Logs

**Create Patient:**
```java
log.info("Creating patient - {}", maskPII(patientDTO.getEmail()));
// Output: "Creating patient - jo***@example.com"
```

**Search:**
```java
log.info("GET /v1/patients - Request received - Phone: {}", 
    phone != null ? phone.substring(0, Math.min(3, phone.length())) + "***" : "null");
// Output: "GET /v1/patients - Request received - Phone: 555***"
```

### Log Examples

**Before Masking:**
```
Creating patient - john.doe@example.com, Phone: 5551234567
```

**After Masking:**
```
Creating patient - jo***@example.com, Phone: 55***67
```

### Benefits

1. **Security Compliance**: Protects sensitive data in logs
2. **Audit Trail**: Maintains request tracking without exposing PII
3. **Debugging**: Still provides enough information for troubleshooting
4. **GDPR/HIPAA Compliance**: Helps meet regulatory requirements

---

## Data Model

### Patient Entity

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `patientId` | Long | Primary key, auto-generated | Unique, Required |
| `name` | String | Full name | Required, Not null |
| `email` | String | Email address | Required, Unique, Not null |
| `phone` | String | Phone number | Required, Not null |
| `dob` | LocalDate | Date of birth | Required, Format: YYYY-MM-DD |
| `createdAt` | LocalDateTime | Creation timestamp | Auto-generated |
| `active` | Boolean | Active status | Default: true |

### PatientDTO

```json
{
  "patientId": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "dob": "1990-01-15",
  "createdAt": "2025-11-02T10:30:00",
  "active": true
}
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "correlationId": "uuid-for-tracking"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Patient not found |
| `DUPLICATE_EMAIL` | 400 | Email already exists |
| `VALIDATION_ERROR` | 400 | Request validation failed |

### Correlation IDs

Every request generates a unique correlation ID (UUID) that:
- Appears in all log entries for that request
- Included in error responses
- Helps trace requests across the system

---

## Pagination

### Pagination Format

All list/search endpoints return paginated responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 60,
    "totalPages": 3
  }
}
```

### Pagination Parameters

- **page**: Page number (1-based, default: 1)
- **limit**: Records per page (default: 20)

### Examples

```
GET /v1/patients?page=1&limit=10   # First page, 10 records
GET /v1/patients?page=2&limit=10   # Second page, 10 records
GET /v1/patients?page=3&limit=20   # Third page, 20 records
```

---

## Database

### Local Development (H2)

- **Type**: In-memory H2 database
- **JDBC URL**: `jdbc:h2:mem:patientdb`
- **Username**: `sa`
- **Password**: (empty)
- **Console**: `http://localhost:8001/h2-console`

**See [H2 Database Access](#h2-database-access) section for detailed instructions.**

### Production (PostgreSQL)

- **Type**: PostgreSQL
- **Connection**: Configured via environment variables
- **Schema**: Auto-created on startup

### Database Schema

```sql
CREATE TABLE patients (
    patient_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

## Monitoring & Health Checks

### Health Endpoint

**GET** `/v1/health`

Returns enhanced service health status with comprehensive information about endpoints, monitoring, logging, and available APIs.

**Response:**
```json
{
  "status": "healthy",
  "service": "patient-service",
  "port": 8001,
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
    "info": "/actuator/info"
  },
  "logging": {
    "format": "JSON",
    "correlationId": "enabled",
    "piiMasking": "enabled"
  },
  "availableEndpoints": {
    "GET": "/v1/patients, /v1/patients/{id}",
    "POST": "/v1/patients",
    "PUT": "/v1/patients/{id}",
    "DELETE": "/v1/patients/{id}"
  }
}
```

### Actuator Endpoints

Spring Boot Actuator provides additional monitoring endpoints:

- `/actuator/health`: Detailed health information
- `/actuator/metrics`: Application metrics
- `/actuator/prometheus`: Prometheus-compatible metrics
- `/actuator/info`: Application information

---

## ER Diagram

### Patient Service Database Schema

```
┌─────────────────────────────────────┐
│          PATIENTS Table              │
├─────────────────────────────────────┤
│ PK │ patient_id       │ BIGINT      │
│    │ name             │ VARCHAR(255)│
│    │ email            │ VARCHAR(255)│ ← UNIQUE
│    │ phone            │ VARCHAR(255)│
│    │ dob              │ DATE        │
│    │ created_at       │ TIMESTAMP   │
│    │ active           │ BOOLEAN     │ ← DEFAULT: true
└─────────────────────────────────────┘
```

### Relationships

- **No Foreign Keys**: Patient Service is isolated (database-per-service pattern)
- **Ownership**: Patient Service owns all patient data
- **References**: Other services reference patients via REST API (not database FKs)

---

## H2 Database Access

### Accessing H2 Console

The H2 console is enabled for local development and testing.

#### Step 1: Open H2 Console

Navigate to: **http://localhost:8001/h2-console**

#### Step 2: Connection Settings

Fill in the following:

| Setting | Value |
|---------|-------|
| **Saved Settings** | Generic H2 (Embedded) |
| **Setting Name** | Generic H2 (Embedded) |
| **Driver Class** | `org.h2.Driver` |
| **JDBC URL** | `jdbc:h2:mem:patientdb` |
| **User Name** | `sa` |
| **Password** | (leave empty) |

#### Step 3: Click "Connect"

**Important Notes:**
- ✅ Use `jdbc:h2:mem:patientdb` (in-memory database)
- ❌ Do NOT use file paths like `/root/test` or `~/patientdb`
- ❌ The database name is `patientdb`, not a file path
- ✅ If you see "Sorry, remote connections ('webAllowOthers') are disabled", ensure the service was built with the latest code

#### Step 4: Run SQL Queries

**View All Patients:**
```sql
SELECT * FROM patients;
```

**View Active Patients:**
```sql
SELECT * FROM patients WHERE active = true;
```

**View Patient Count:**
```sql
SELECT COUNT(*) as total_patients FROM patients;
```

**View Patients Created Today:**
```sql
SELECT * FROM patients WHERE DATE(created_at) = CURRENT_DATE;
```

**Search by Name:**
```sql
SELECT * FROM patients WHERE LOWER(name) LIKE '%john%';
```

**Search by Email:**
```sql
SELECT * FROM patients WHERE email LIKE '%@example.com';
```

### Database Connection Details

| Property | Value |
|----------|-------|
| **Database Type** | H2 (In-Memory) |
| **JDBC URL** | `jdbc:h2:mem:patientdb` |
| **Username** | `sa` |
| **Password** | (empty) |
| **Console URL** | `http://localhost:8001/h2-console` |
| **Persistence** | In-memory (data lost on container restart) |

### Troubleshooting H2 Console

**Issue: "Sorry, remote connections ('webAllowOthers') are disabled"**
- **Solution**: Ensure `application.yml` has:
  ```yaml
  spring:
    h2:
      console:
        settings:
          web-allow-others: true
  ```
- Rebuild and restart the container

**Issue: "Database not found"**
- **Solution**: Use `jdbc:h2:mem:patientdb` (not a file path)
- The database name is `patientdb` for in-memory H2

---

## Docker Deployment

### 🚀 Quick Start with Docker Compose

**📍 Run all commands from the project root directory:**
```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Start Patient Service:**
```bash
# Build and start the service
docker-compose build patient-service
docker-compose up -d patient-service

# Or rebuild (no cache) and start
docker-compose build --no-cache patient-service
docker-compose up -d patient-service
```

**Start all services (including dependencies):**
```bash
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
docker-compose logs -f patient-service
```

**Verify service is running:**
```bash
curl http://localhost:8001/v1/health
```

**Restart service:**
```bash
docker-compose restart patient-service
```

**Stop service:**
```bash
docker-compose stop patient-service
# Or stop all services
docker-compose down
```

**Rebuild and restart (complete refresh):**
```bash
docker-compose build --no-cache patient-service && docker-compose up -d patient-service
```

---

### Building the Docker Container

#### Method 1: Docker Build (Standalone)

**Build the image:**
```bash
cd hospital-management-system
docker build -t patient-service:latest ./patient-service
```

**Build details:**
- Uses multi-stage build (Maven build stage + JRE runtime stage)
- Build stage: `maven:3.9-eclipse-temurin-17` (for compiling)
- Runtime stage: `eclipse-temurin:17-jre` (lightweight runtime)
- Platform: `linux/amd64` (compatible with Apple Silicon via emulation)

**Verify build:**
```bash
docker images | grep patient-service
```

#### Method 2: Docker Compose Build

**Build and start:**
```bash
cd hospital-management-system
docker compose build patient-service
docker compose up -d patient-service
```

**Build all services:**
```bash
docker compose build
docker compose up -d
```

### Running the Container

#### Standalone Container

**Run container:**
```bash
docker run -d \
  --name patient-service \
  -p 8001:8001 \
  patient-service:latest
```

**View logs:**
```bash
docker logs patient-service
docker logs -f patient-service  # Follow logs
```

**Stop container:**
```bash
docker stop patient-service
docker rm patient-service
```

#### Docker Compose

**Start service:**
```bash
docker compose up -d patient-service
```

**View logs:**
```bash
docker compose logs patient-service
docker compose logs -f patient-service  # Follow logs
```

**Restart service:**
```bash
docker compose restart patient-service
```

**Stop service:**
```bash
docker compose stop patient-service
```

**Rebuild and restart:**
```bash
docker compose build patient-service
docker compose restart patient-service
```

### Dockerfile Explanation

```dockerfile
# Build Stage - Compiles the application
FROM --platform=linux/amd64 maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage - Runs the compiled JAR
FROM --platform=linux/amd64 eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8001
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Key Points:**
- **Multi-stage build**: Reduces final image size (no Maven in runtime)
- **Platform**: `linux/amd64` ensures compatibility (works on Apple Silicon via emulation)
- **Port**: 8001 exposed for API access
- **Entrypoint**: Runs Spring Boot JAR file

### Health Check

**Check service health:**
```bash
curl http://localhost:8001/v1/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "patient-service"
}
```

### Docker Compose Configuration

The service is configured in `docker-compose.yml`:

```yaml
patient-service:
  build: ./patient-service
  container_name: patient-service
  ports:
    - "8001:8001"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/v1/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Notes:**
- H2 database is embedded (in-memory)
- No separate database container needed
- Health check runs every 30 seconds
- Service waits 40 seconds before first health check

### Production Deployment

For production, use PostgreSQL instead of H2:

**Update `application-prod.yml`:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
```

**Environment Variables:**
```bash
DB_HOST=postgres-host
DB_PORT=5432
DB_NAME=patientdb
DB_USER=patient_user
DB_PASSWORD=secure_password
```

### Kubernetes

See `kubernetes/patient-service-deployment.yaml` for Kubernetes deployment manifests with:
- Deployment configuration
- Service configuration
- ConfigMap for application settings
- Secret for database credentials
- PostgreSQL database deployment
- Persistent Volume Claims

---

## Testing

### API Testing Script

Use the provided Postman collection (see `docs/Patient-Service.postman_collection.json`) or test manually with curl:

**Create Patient:**
```bash
curl -X POST http://localhost:8001/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "5551234567",
    "dob": "1990-01-15"
  }'
```

**Get Patient:**
```bash
curl http://localhost:8001/v1/patients/1
```

**Search:**
```bash
curl "http://localhost:8001/v1/patients?name=John&page=1&limit=10"
```

**Update:**
```bash
curl -X PUT http://localhost:8001/v1/patients/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "5559876543",
    "dob": "1990-01-15"
  }'
```

**Delete:**
```bash
curl -X DELETE http://localhost:8001/v1/patients/1
```

---

## Best Practices

1. **Always use correlation IDs** for request tracking
2. **Validate input** before processing
3. **Use pagination** for large result sets
4. **PII masking** is automatic - no manual intervention needed
5. **Error handling** - always check response codes
6. **Database transactions** - all write operations are transactional

---

## Support & Contact

For issues or questions:
- Check logs with correlation ID for troubleshooting
- Review error responses for detailed error messages
- Verify database connectivity for persistent issues

---

**Version:** 1.0.0  
**Last Updated:** November 2025

