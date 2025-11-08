# Database Architecture - Database-Per-Service Pattern

This document describes the database-per-service architecture with ER diagrams and context maps.

## Architecture Overview

The Hospital Management System follows the **database-per-service** pattern. Each microservice has its own independent database with no shared tables or cross-database joins. Services communicate via REST APIs only.

## Context Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOSPITAL MANAGEMENT SYSTEM                   │
│                     (Microservices Context Map)                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Patient Service │      │  Doctor Service   │      │ Appointment      │
│                  │      │                  │      │    Service       │
│  patientdb       │      │   doctordb       │      │ appointmentdb    │
│  (H2)            │      │   (H2)           │      │ (H2)            │
│                  │      │                  │      │                  │
│  Tables:         │      │  Tables:         │      │  Tables:         │
│  - patients      │      │  - doctors       │      │  - appointments  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                        │                            │
        │                        │                            │
        └────────────────────────┼────────────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   REST API Calls          │
                    │   (No DB Joins)           │
                    └─────────────┬─────────────┘
                                 │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐                                    ┌─────────▼──────────┐
│ Billing       │                                    │  Notification      │
│ Service       │                                    │  Service            │
│               │                                    │                     │
│ billingdb     │                                    │ (No DB - Stateless)│
│ (H2)          │                                    │                     │
│               │                                    │                     │
│ Tables:       │                                    │  Alerts Only       │
│ - bills       │                                    │  (Frontend)        │
└───────────────┘                                    └────────────────────┘

Replicated Read Models:
- Appointment Service caches: doctor_department (from Doctor Service)
- Billing Service references: patient_id, appointment_id (via REST)
```

## ER Diagrams Per Service

### 1. Patient Service (patientdb)

```
┌─────────────────────────────────────┐
│          PATIENTS Table              │
├─────────────────────────────────────┤
│ PK │ patient_id       │ BIGINT      │
│    │ name             │ VARCHAR     │
│    │ email            │ VARCHAR(UK) │
│    │ phone            │ VARCHAR     │
│    │ dob              │ DATE        │
│    │ created_at       │ TIMESTAMP   │
│    │ active           │ BOOLEAN     │
└─────────────────────────────────────┘

Ownership: Patient Service owns all patient data
Relationships: None (isolated service)
```

### 2. Doctor Service (doctordb)

```
┌─────────────────────────────────────┐
│          DOCTORS Table              │
├─────────────────────────────────────┤
│ PK │ doctor_id        │ BIGINT      │
│    │ name             │ VARCHAR     │
│    │ email            │ VARCHAR(UK) │
│    │ phone            │ VARCHAR     │
│    │ department       │ VARCHAR     │
│    │ specialization   │ VARCHAR     │
│    │ created_at       │ TIMESTAMP   │
│    │ active           │ BOOLEAN     │
└─────────────────────────────────────┘

Ownership: Doctor Service owns all doctor data
Relationships: None (isolated service)
```

### 3. Appointment Service (appointmentdb)

```
┌─────────────────────────────────────┐
│      APPOINTMENTS Table             │
├─────────────────────────────────────┤
│ PK │ appointment_id   │ BIGINT      │
│    │ patient_id       │ BIGINT (FK) │  ───┐
│    │ doctor_id       │ BIGINT (FK) │  ───┤  External References
│    │ department       │ VARCHAR     │  ───┤  (No actual FK constraint)
│    │ slot_start       │ TIMESTAMP   │     │
│    │ slot_end         │ TIMESTAMP   │     │
│    │ status           │ ENUM        │     │
│    │ created_at       │ TIMESTAMP   │     │
│    │ reschedule_count │ INTEGER     │     │
│    │ version          │ BIGINT      │     │
└─────────────────────────────────────┘

Ownership: Appointment Service owns appointment lifecycle
Replicated Read Model: department (cached from Doctor Service)
Relationships: 
  - patient_id references Patient Service (via REST API)
  - doctor_id references Doctor Service (via REST API)
  - department cached locally for reporting
```

### 4. Billing Service (billingdb)

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
│    │ status           │ ENUM        │     │
│    │ created_at       │ TIMESTAMP   │     │
└─────────────────────────────────────┘

Ownership: Billing Service owns all billing data
Relationships:
  - patient_id references Patient Service (via REST API)
  - appointment_id references Appointment Service (via REST API)
```


## Data Ownership Rules

1. **No Shared Tables**: Each service has its own database
2. **No Cross-DB Joins**: Services communicate via REST APIs only
3. **Replicated Read Models**: 
   - Appointment Service caches `department` from Doctor Service for reporting
   - This is a denormalized copy, not a real FK relationship
4. **Referential Integrity**: Enforced via application logic, not database constraints
5. **Eventual Consistency**: Services may have slightly stale data (acceptable for this domain)

## API Composition Pattern

When services need data from other services, they use **API Composition**:

```
Example: Get Appointment with Patient Details
1. Appointment Service queries its own appointmentdb
2. Appointment Service calls Patient Service API: GET /v1/patients/{id}
3. Appointment Service combines results in application layer
4. Returns composed response to client
```

## Summary

- ✅ Database-per-service pattern implemented
- ✅ No shared tables
- ✅ No cross-database joins
- ✅ Replicated read models where needed (department in appointments)
- ✅ All relationships via REST APIs
- ✅ Each service owns its data completely


