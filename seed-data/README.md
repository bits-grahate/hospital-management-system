# Seed Data Loading Guide

## Problem
H2 in-memory databases (`jdbc:h2:mem:*`) are only accessible from within the same JVM process. External scripts cannot connect to the databases used by running Spring Boot services.

## H2 Console JDBC URLs

Quick reference for H2 Console connections:

| Service | Port | H2 Console URL | JDBC URL | Username | Password |
|---------|------|----------------|----------|----------|----------|
| **Patient Service** | 8001 | http://localhost:8001/h2-console | `jdbc:h2:mem:patientdb` | `sa` | (empty) |
| **Doctor Service** | 8002 | http://localhost:8002/h2-console | `jdbc:h2:mem:doctordb` | `sa` | (empty) |
| **Appointment Service** | 8003 | http://localhost:8003/h2-console | `jdbc:h2:mem:appointmentdb` | `sa` | (empty) |
| **Billing Service** | 8004 | http://localhost:8004/h2-console | `jdbc:h2:mem:billingdb` | `sa` | (empty) |

## Solution Options

### Option 1: Use H2 Console (Manual - Recommended for now)
1. Open H2 Console for each service:
   - Patient Service: http://localhost:8001/h2-console
   - Doctor Service: http://localhost:8002/h2-console
   - Appointment Service: http://localhost:8003/h2-console
   - Billing Service: http://localhost:8004/h2-console

2. Connect with:
   - JDBC URL: `jdbc:h2:mem:patientdb` (or respective database name)
   - Username: `sa`
   - Password: (empty)

3. Execute SQL in this order:
   - First: Run `TRUNCATE TABLE <table_name>;` to drop all data
   - Second: Run `ALTER TABLE <table_name> ALTER COLUMN <id_column> RESTART WITH 1;` to reset IDs
   - Third: Copy and paste SQL from seed files:
     - `insert-patients.sql`
     - `insert-doctors.sql`
     - `insert-appointments.sql`
     - `insert-bills.sql`

### Option 2: Use Spring Boot data.sql (Automatic)
Spring Boot can automatically execute SQL on startup using `data.sql` files.

1. Copy seed SQL files to each service's `src/main/resources/` directory:
   ```bash
   cp seed-data/insert-patients.sql patient-service/src/main/resources/data.sql
   cp seed-data/insert-doctors.sql doctor-service/src/main/resources/data.sql
   cp seed-data/insert-appointments.sql appointment-service/src/main/resources/data.sql
   cp seed-data/insert-bills.sql billing-service/src/main/resources/data.sql
   ```

2. Restart services - SQL will execute automatically on startup.

### Option 3: Create REST Endpoints (Future Enhancement)
Add REST endpoints to each service to execute SQL via HTTP API.

## Quick Reference

### Reset and Load Script
The `load-seed-data.sh` script provides instructions but cannot directly execute SQL on in-memory databases.

### SQL Files
- `reset-ids.sql` - Reset ID sequences
- `insert-patients.sql` - Patient seed data
- `insert-doctors.sql` - Doctor seed data
- `insert-appointments.sql` - Appointment seed data
- `insert-bills.sql` - Bill seed data
