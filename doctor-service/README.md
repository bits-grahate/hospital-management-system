# Doctor Service - Microservice Documentation

## Overview

The **Doctor Service** is a microservice responsible for managing doctor records and scheduling information in the Hospital Management System. It provides complete CRUD operations, filtering functionality, and slot availability checks for appointment booking.

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Data Model](#data-model)
5. [Error Handling](#error-handling)
6. [Pagination](#pagination)
7. [Filtering](#filtering)
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
- **Port**: 8002 (default)

### Service Characteristics

- **Microservice**: Independent, isolated service with its own database
- **Database-Per-Service**: Uses dedicated database (`doctordb`)
- **RESTful API**: All endpoints follow REST principles
- **API Versioning**: All endpoints use `/v1` prefix
- **Structured Logging**: JSON format with correlation IDs
- **CORS Enabled**: Supports cross-origin requests from frontend

---

## Features

### 1. CRUD Operations

- ✅ **Create**: Add new doctors with validation
- ✅ **Read**: Get doctor by ID or list with pagination and filters
- ✅ **Update**: (Future enhancement)
- ✅ **Delete**: (Future enhancement - soft delete with `active` flag)

### 2. Filtering Functionality

- ✅ **Filter by Department**: Get all doctors in a specific department
- ✅ **Filter by Specialization**: Get all doctors with a specific specialization
- ✅ **Combined Filtering**: Filter by both department and specialization simultaneously
- ✅ **List All Departments**: Get all unique department names
- ✅ **List All Specializations**: Get all unique specialization names

### 3. Slot Availability Checks

- ✅ **Check Doctor Availability**: Verify if a doctor is available for a specific time slot
- ✅ **Clinic Hours Validation**: Ensures slots are within clinic hours (9 AM - 6 PM)
- ✅ **Lead Time Validation**: Ensures slots are at least 2 hours from current time
- ✅ **Department Match**: Validates doctor belongs to requested department

---

## API Endpoints

### Base URL

```
http://localhost:8002/v1
```

### Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "doctor-service"
}
```

---

### Create Doctor

**POST** `/doctors`

Create a new doctor record.

**Request Body:**
```json
{
  "name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "phone": "5551234567",
  "department": "Cardiology",
  "specialization": "Heart Specialist"
}
```

**Response:** `201 Created`
```json
{
  "doctorId": 1,
  "name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "phone": "5551234567",
  "department": "Cardiology",
  "specialization": "Heart Specialist",
  "createdAt": "2025-11-02T09:00:00",
  "active": true
}
```

**Validation:**
- `name`: Required, not blank
- `email`: Required, valid email format, must be unique
- `phone`: Required, not blank
- `department`: Required, not blank
- `specialization`: Required, not blank

**Error Response:** `400 Bad Request`
```json
{
  "code": "ERROR",
  "message": "Email already exists",
  "correlationId": "uuid-here"
}
```

---

### Get Doctor by ID

**GET** `/doctors/{doctorId}`

Retrieve a specific doctor by ID.

**Response:** `200 OK`
```json
{
  "doctorId": 1,
  "name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "phone": "5551234567",
  "department": "Cardiology",
  "specialization": "Heart Specialist",
  "createdAt": "2025-11-02T09:00:00",
  "active": true
}
```

**Error Response:** `404 Not Found`
```json
{
  "code": "NOT_FOUND",
  "message": "Doctor not found",
  "correlationId": "uuid-here"
}
```

---

### List Doctors

**GET** `/doctors`

List all doctors with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `department` | String | No | - | Filter by department name |
| `specialization` | String | No | - | Filter by specialization |
| `page` | Integer | No | 1 | Page number (1-based) |
| `size` | Integer | No | 20 | Records per page |
| `limit` | Integer | No | 20 | Records per page (alternative to `size`) |

**Examples:**

```
GET /v1/doctors                           # All doctors, page 1, 20 per page
GET /v1/doctors?page=2&limit=10          # Page 2, 10 per page
GET /v1/doctors?department=Cardiology    # Filter by department
GET /v1/doctors?specialization=Heart Specialist  # Filter by specialization
GET /v1/doctors?department=Cardiology&specialization=Heart Specialist  # Combined filter
GET /v1/doctors?page=1&limit=100         # First page, 100 records
```

**Response:** `200 OK`
```json
{
  "content": [
    {
      "doctorId": 1,
      "name": "Dr. John Smith",
      "email": "john.smith@hospital.com",
      "phone": "5551234567",
      "department": "Cardiology",
      "specialization": "Heart Specialist",
      "createdAt": "2025-11-02T09:00:00",
      "active": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 25,
  "totalPages": 2,
  "last": false,
  "first": true,
  "number": 0,
  "size": 20,
  "numberOfElements": 20
}
```

**Note:** 
- Only active doctors (`active = true`) are returned in filtered results
- `page=0` is automatically converted to `page=1`
- `limit` parameter takes precedence over `size`

---

### Check Slot Availability

**POST** `/doctors/{doctorId}/check-availability`

Check if a doctor is available for a specific time slot.

**Request Body:**
```json
{
  "slotStart": "2025-11-03T14:00:00Z",
  "slotEnd": "2025-11-03T14:30:00Z",
  "department": "Cardiology"
}
```

**Response:** `200 OK`
```json
{
  "available": true,
  "message": "Slot is available"
}
```

**Response (Not Available):** `200 OK`
```json
{
  "available": false,
  "message": "Outside clinic hours (9 AM - 6 PM)"
}
```

**Validation Rules:**
1. **Clinic Hours**: Slot must be between 9 AM and 6 PM
2. **Lead Time**: Slot must be at least 2 hours from current time
3. **Department Match**: If provided, doctor must belong to the specified department

**Possible Messages:**
- `"Slot is available"` - Slot is valid and available
- `"Outside clinic hours (9 AM - 6 PM)"` - Slot time is outside clinic hours
- `"Slot must be at least 2 hours from now"` - Slot is too soon
- `"Doctor belongs to {department}, not {requestedDepartment}"` - Department mismatch

**Error Response:** `404 Not Found`
```json
{
  "code": "NOT_FOUND",
  "message": "Doctor not found",
  "correlationId": "uuid-here"
}
```

---

### List Departments

**GET** `/departments`

Get all unique department names from active doctors.

**Response:** `200 OK`
```json
[
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Dermatology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
  "Psychiatry"
]
```

---

### List Specializations

**GET** `/specializations`

Get all unique specialization names from active doctors.

**Response:** `200 OK`
```json
[
  "Heart Specialist",
  "Brain Specialist",
  "Bone Specialist",
  "Child Specialist",
  "Cancer Specialist",
  "Skin Specialist",
  "Digestive Specialist",
  "Lung Specialist",
  "Hormone Specialist",
  "Mental Health Specialist"
]
```

---

## Data Model

### Doctor Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `doctorId` | Long | Primary Key, Auto-generated | Unique doctor identifier |
| `name` | String | Required, Not Blank | Doctor's full name |
| `email` | String | Required, Unique, Valid Email | Doctor's email address |
| `phone` | String | Required, Not Blank | Doctor's phone number |
| `department` | String | Required, Not Blank | Department name (e.g., "Cardiology") |
| `specialization` | String | Required, Not Blank | Specialization name (e.g., "Heart Specialist") |
| `createdAt` | LocalDateTime | Auto-generated | Timestamp when record was created |
| `active` | Boolean | Default: true | Soft delete flag |

### DoctorDTO

```json
{
  "doctorId": 1,
  "name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "phone": "5551234567",
  "department": "Cardiology",
  "specialization": "Heart Specialist",
  "createdAt": "2025-11-02T09:00:00",
  "active": true
}
```

### SlotCheckRequest

```json
{
  "slotStart": "2025-11-03T14:00:00Z",
  "slotEnd": "2025-11-03T14:30:00Z",
  "department": "Cardiology"
}
```

**Fields:**
- `slotStart`: ISO 8601 timestamp (required)
- `slotEnd`: ISO 8601 timestamp (required)
- `department`: Department name (optional, for validation)

### SlotCheckResponse

```json
{
  "available": true,
  "message": "Slot is available"
}
```

**Fields:**
- `available`: Boolean indicating availability
- `message`: Human-readable message explaining the result

---

## Error Handling

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
| `NOT_FOUND` | 404 | Doctor not found |
| `ERROR` | 400 | Validation error or business rule violation |

### Correlation IDs

Every request generates a unique correlation ID (UUID) that:
- Appears in all log entries for that request
- Included in error responses
- Helps trace requests across the system

---

## Pagination

### Pagination Format

All list endpoints return paginated responses using Spring Data's `Page` format:

```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 25,
  "totalPages": 2,
  "last": false,
  "first": true,
  "number": 0,
  "size": 20,
  "numberOfElements": 20
}
```

### Pagination Parameters

- **page**: Page number (1-based, default: 1)
  - `page=0` is automatically converted to `page=1`
- **limit** or **size**: Records per page (default: 20)
  - `limit` parameter takes precedence over `size`

### Examples

```
GET /v1/doctors?page=1&limit=10    # First page, 10 records
GET /v1/doctors?page=2&limit=10    # Second page, 10 records
GET /v1/doctors?page=1&limit=100   # First page, 100 records
GET /v1/doctors?page=0&size=20     # Auto-converted to page=1
```

---

## Filtering

### Filter Options

**By Department:**
```
GET /v1/doctors?department=Cardiology
```

**By Specialization:**
```
GET /v1/doctors?specialization=Heart Specialist
```

**Combined (Both Department and Specialization):**
```
GET /v1/doctors?department=Cardiology&specialization=Heart Specialist
```

**Notes:**
- Filters are case-sensitive (exact match)
- Only active doctors are returned in filtered results
- Multiple filters are combined with AND logic
- Filters work with pagination

### Filter Response

Filtered results return Spring Data `Page` format with pagination metadata:

```json
{
  "content": [...],
  "totalElements": 3,
  "totalPages": 1,
  ...
}
```

---

## Database

### Local Development (H2)

- **Type**: In-memory H2 database
- **JDBC URL**: `jdbc:h2:mem:doctordb`
- **Username**: `sa`
- **Password**: (empty)
- **Console**: `http://localhost:8002/h2-console`

**See [H2 Database Access](#h2-database-access) section for detailed instructions.**

### Production (PostgreSQL)

- **Type**: PostgreSQL
- **Connection**: Configured via environment variables
- **Schema**: Auto-created on startup

### Database Schema

```sql
CREATE TABLE doctors (
    doctor_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
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
  "service": "doctor-service",
  "port": 8002,
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
    "correlationId": "enabled"
  },
  "availableEndpoints": {
    "GET": "/v1/doctors, /v1/doctors/{id}, /v1/departments, /v1/specializations",
    "POST": "/v1/doctors, /v1/doctors/{id}/check-availability"
  }
}
```

### Actuator Endpoints

Spring Boot Actuator provides additional monitoring endpoints:

- `/actuator/health`: Detailed health information
- `/actuator/metrics`: Application metrics
- `/actuator/info`: Application information

---

## ER Diagram

### Doctor Service Database Schema

```
┌─────────────────────────────────────┐
│          DOCTORS Table              │
├─────────────────────────────────────┤
│ PK │ doctor_id        │ BIGINT      │
│    │ name             │ VARCHAR(255)│
│    │ email            │ VARCHAR(255)│ ← UNIQUE
│    │ phone            │ VARCHAR(255)│
│    │ department       │ VARCHAR(255)│
│    │ specialization   │ VARCHAR(255)│
│    │ created_at       │ TIMESTAMP   │
│    │ active           │ BOOLEAN     │ ← DEFAULT: true
└─────────────────────────────────────┘
```

### Relationships

- **No Foreign Keys**: Doctor Service is isolated (database-per-service pattern)
- **Ownership**: Doctor Service owns all doctor data
- **References**: Other services reference doctors via REST API (not database FKs)

---

## H2 Database Access

### Accessing H2 Console

The H2 console is enabled for local development and testing.

#### Step 1: Open H2 Console

Navigate to: **http://localhost:8002/h2-console**

#### Step 2: Connection Settings

Fill in the following:

| Setting | Value |
|---------|-------|
| **Saved Settings** | Generic H2 (Embedded) |
| **Setting Name** | Generic H2 (Embedded) |
| **Driver Class** | `org.h2.Driver` |
| **JDBC URL** | `jdbc:h2:mem:doctordb` |
| **User Name** | `sa` |
| **Password** | (leave empty) |

#### Step 3: Click "Connect"

**Important Notes:**
- ✅ Use `jdbc:h2:mem:doctordb` (in-memory database)
- ❌ Do NOT use file paths like `/root/test` or `~/doctordb`
- ❌ The database name is `doctordb`, not a file path
- ✅ If you see "Sorry, remote connections ('webAllowOthers') are disabled", ensure the service was built with the latest code

#### Step 4: Run SQL Queries

**View All Doctors:**
```sql
SELECT * FROM doctors;
```

**View Active Doctors:**
```sql
SELECT * FROM doctors WHERE active = true;
```

**View Doctor Count:**
```sql
SELECT COUNT(*) as total_doctors FROM doctors;
```

**View Doctors by Department:**
```sql
SELECT * FROM doctors WHERE department = 'Cardiology';
```

**View Doctors by Specialization:**
```sql
SELECT * FROM doctors WHERE specialization = 'Heart Specialist';
```

**View Unique Departments:**
```sql
SELECT DISTINCT department FROM doctors WHERE active = true;
```

**View Unique Specializations:**
```sql
SELECT DISTINCT specialization FROM doctors WHERE active = true;
```

**View Doctors Created Today:**
```sql
SELECT * FROM doctors WHERE DATE(created_at) = CURRENT_DATE;
```

### Database Connection Details

| Property | Value |
|----------|-------|
| **Database Type** | H2 (In-Memory) |
| **JDBC URL** | `jdbc:h2:mem:doctordb` |
| **Username** | `sa` |
| **Password** | (empty) |
| **Console URL** | `http://localhost:8002/h2-console` |
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
- **Solution**: Use `jdbc:h2:mem:doctordb` (not a file path)
- The database name is `doctordb` for in-memory H2

---

## Docker Deployment

### 🚀 Quick Start with Docker Compose

**📍 Run all commands from the project root directory:**
```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Start Doctor Service:**
```bash
# Build and start the service
docker-compose build doctor-service
docker-compose up -d doctor-service

# Or rebuild (no cache) and start
docker-compose build --no-cache doctor-service
docker-compose up -d doctor-service
```

**Start all services (including dependencies):**
```bash
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
docker-compose logs -f doctor-service
```

**Verify service is running:**
```bash
curl http://localhost:8002/v1/health
```

**Restart service:**
```bash
docker-compose restart doctor-service
```

**Stop service:**
```bash
docker-compose stop doctor-service
# Or stop all services
docker-compose down
```

**Rebuild and restart (complete refresh):**
```bash
docker-compose build --no-cache doctor-service && docker-compose up -d doctor-service
```

---

### Building the Docker Container

#### Method 1: Docker Build (Standalone)

**Build the image:**
```bash
cd hospital-management-system
docker build -t doctor-service:latest ./doctor-service
```

**Build details:**
- Uses multi-stage build (Maven build stage + JRE runtime stage)
- Build stage: `maven:3.9-eclipse-temurin-17` (for compiling)
- Runtime stage: `eclipse-temurin:17-jre` (lightweight runtime)
- Platform: `linux/amd64` (compatible with Apple Silicon via emulation)

**Verify build:**
```bash
docker images | grep doctor-service
```

#### Method 2: Docker Compose Build

**Build and start:**
```bash
cd hospital-management-system
docker compose build doctor-service
docker compose up -d doctor-service
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
  --name doctor-service \
  -p 8002:8002 \
  doctor-service:latest
```

**View logs:**
```bash
docker logs doctor-service
docker logs -f doctor-service  # Follow logs
```

**Stop container:**
```bash
docker stop doctor-service
docker rm doctor-service
```

#### Docker Compose

**Start service:**
```bash
docker compose up -d doctor-service
```

**View logs:**
```bash
docker compose logs doctor-service
docker compose logs -f doctor-service  # Follow logs
```

**Restart service:**
```bash
docker compose restart doctor-service
```

**Stop service:**
```bash
docker compose stop doctor-service
```

**Rebuild and restart:**
```bash
docker compose build doctor-service
docker compose restart doctor-service
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
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Key Points:**
- **Multi-stage build**: Reduces final image size (no Maven in runtime)
- **Platform**: `linux/amd64` ensures compatibility (works on Apple Silicon via emulation)
- **Port**: 8002 exposed for API access
- **Entrypoint**: Runs Spring Boot JAR file

### Health Check

**Check service health:**
```bash
curl http://localhost:8002/v1/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "doctor-service"
}
```

### Docker Compose Configuration

The service is configured in `docker-compose.yml`:

```yaml
doctor-service:
  build: ./doctor-service
  container_name: doctor-service
  ports:
    - "8002:8002"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8002/v1/health"]
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
DB_NAME=doctordb
DB_USER=doctor_user
DB_PASSWORD=secure_password
```

### Kubernetes

See `kubernetes/doctor-service-deployment.yaml` for Kubernetes deployment manifests with:
- Deployment configuration
- Service configuration
- ConfigMap for application settings
- Secret for database credentials
- PostgreSQL database deployment
- Persistent Volume Claims

---

## Testing

### API Testing Script

Use the provided Postman collection (see `docs/doctor-service/Doctor-Service.postman_collection.json`) or test manually with curl:

**Health Check:**
```bash
curl http://localhost:8002/v1/health
```

**Create Doctor:**
```bash
curl -X POST http://localhost:8002/v1/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "phone": "5551234567",
    "department": "Cardiology",
    "specialization": "Heart Specialist"
  }'
```

**Get Doctor:**
```bash
curl http://localhost:8002/v1/doctors/1
```

**List Doctors:**
```bash
curl "http://localhost:8002/v1/doctors?page=1&limit=10"
```

**Filter by Department:**
```bash
curl "http://localhost:8002/v1/doctors?department=Cardiology"
```

**Filter by Specialization:**
```bash
curl "http://localhost:8002/v1/doctors?specialization=Heart%20Specialist"
```

**List Departments:**
```bash
curl http://localhost:8002/v1/departments
```

**List Specializations:**
```bash
curl http://localhost:8002/v1/specializations
```

**Check Availability:**
```bash
curl -X POST http://localhost:8002/v1/doctors/1/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "slotStart": "2025-11-03T14:00:00Z",
    "slotEnd": "2025-11-03T14:30:00Z",
    "department": "Cardiology"
  }'
```

---

## Best Practices

1. **Always use correlation IDs** for request tracking
2. **Validate input** before processing
3. **Use pagination** for large result sets
4. **Filter by department/specialization** to reduce result sets
5. **Check slot availability** before booking appointments
6. **Error handling** - always check response codes
7. **Database transactions** - all write operations are transactional

---

## Support & Contact

For issues or questions:
- Check logs with correlation ID for troubleshooting
- Review error responses for detailed error messages
- Verify database connectivity for persistent issues

---

**Version:** 1.0.0  
**Last Updated:** November 2025


