# Hospital Management System

## 📝 Brief Application Description

The **Hospital Management System** is a comprehensive microservices-based application designed to manage hospital operations including patient records, doctor scheduling, appointment booking, and billing. Built with **Java Spring Boot** and **React**, the system follows the **database-per-service** architecture pattern, ensuring each microservice operates independently with its own database.

### Key Capabilities

- **Patient Management**: Complete CRUD operations for patient records with search functionality and PII protection
- **Doctor Management**: Doctor listing, department filtering, and availability checking
- **Appointment Management**: Book, reschedule, cancel, and complete appointments with business rule enforcement
- **Billing Management**: Automatic bill generation, tax calculation, and fee management for cancellations and no-shows
- **Frontend Dashboard**: Modern React-based UI for managing all operations

### Technology Highlights

- **Microservices Architecture**: 4 independent services (Patient, Doctor, Appointment, Billing)
- **Database-Per-Service**: Each service has its own isolated database
- **RESTful APIs**: Versioned APIs (`/v1`) with OpenAPI 3.0 documentation
- **Containerization**: Docker and Docker Compose support for easy deployment
- **Kubernetes Ready**: Complete manifests for Minikube deployment
- **Observability**: Health checks, metrics, and structured logging

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Services](#services)
4. [Tech Stack](#tech-stack)
5. [Quick Start](#quick-start)
6. [API Documentation](#api-documentation)
7. [Detailed Documentation](#detailed-documentation)
8. [Deployment](#deployment)
9. [Monitoring & Observability](#monitoring--observability)
10. [Business Rules](#business-rules)
11. [Project Structure](#project-structure)

---

## 🎯 Overview

The Hospital Management System is a microservices-based application that manages patients, doctors, appointments, and billing operations. The system follows the **database-per-service** pattern, ensuring each microservice has its own independent database with no shared tables or cross-database joins.

### Key Features

- ✅ **Microservices Architecture**: 4 core services (Patient, Doctor, Appointment, Billing)
- ✅ **Database-Per-Service**: Independent databases for each service
- ✅ **RESTful APIs**: Versioned APIs (`/v1`) with OpenAPI 3.0 documentation
- ✅ **Inter-Service Communication**: Service-to-service REST calls
- ✅ **Business Rules Enforcement**: Clinic hours, lead times, daily caps, reschedule limits
- ✅ **Error Handling**: Standardized error responses with correlation IDs
- ✅ **PII Masking**: Patient data masking in logs
- ✅ **Containerization**: Docker and Docker Compose support
- ✅ **Kubernetes Ready**: Complete manifests for Minikube deployment
- ✅ **Observability**: Health checks, metrics, structured logging
- ✅ **React Frontend**: Modern UI with Material-UI components

---

## 🏗️ System Architecture

### Architecture Overview

The system follows a **microservices architecture** with the **database-per-service** pattern, ensuring complete service independence and scalability.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSPITAL MANAGEMENT SYSTEM               │
│                  (Microservices Architecture)               │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Patient    │  │    Doctor    │  │ Appointment  │  │   Billing    │
│   Service    │  │   Service    │  │   Service    │  │   Service    │
│              │  │              │  │              │  │              │
│  Port: 8001  │  │  Port: 8002  │  │ Port: 8003   │  │ Port: 8004   │
│  patientdb   │  │  doctordb    │  │appointmentdb │  │  billingdb   │
│(H2/Postgres) │  │(H2/Postgres) │  │(H2/Postgres) │  │(H2/Postgres) │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┼─────────────────┼─────────────────┘
                         │                 │
                    REST API Calls
                    (No DB Joins)
                         │
              ┌──────────┴──────────┐
              │   React Frontend   │
              │    Port: 3000      │
              │   (Nginx Server)   │
              └────────────────────┘
```

**Screenshot Placeholder:** *[Screenshot: System architecture diagram]*

### Service Communication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │ Appointment │ ──────> │   Patient   │
│  (React)    │         │   Service   │         │   Service   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │
                              ▼
                        ┌─────────────┐
                        │   Doctor    │
                        │   Service   │
                        └─────────────┘
                              │
                              │
                              ▼
                        ┌─────────────┐
                        │   Billing   │
                        │   Service   │
                        └─────────────┘
```

**Screenshot Placeholder:** *[Screenshot: Service communication flow]*

### Database Architecture

Each service maintains its own independent database:

- **Patient Service**: `patientdb` - Stores patient records
- **Doctor Service**: `doctordb` - Stores doctor information
- **Appointment Service**: `appointmentdb` - Stores appointment records
- **Billing Service**: `billingdb` - Stores billing information

**Screenshot Placeholder:** *[Screenshot: Database architecture diagram]*

For detailed ER diagrams and context maps, see [Database Architecture](./docs/DATABASE_ARCHITECTURE.md).

### Architecture Principles

- **Database-Per-Service**: Each service has its own database (H2 for local, PostgreSQL for production)
- **API-First Communication**: Services communicate via REST APIs only
- **No Shared Databases**: No cross-database joins or shared tables
- **Replicated Read Models**: Services cache necessary data (e.g., Appointment Service caches `doctor_department`)
- **Service Independence**: Services can be developed, deployed, and scaled independently

### Deployment Architecture

#### Docker Compose Deployment

```
┌────────────────────────────────────────────────────┐
│           Docker Compose Network                   │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │   Patient    │  │    Doctor    │  │Appointment ││
│  │   Service    │  │   Service    │  │  Service   ││
│  │   Port:8001  │  │  Port:8002   │  │ Port:8003  ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                    │
│  ┌──────────────┐                                  │
│  │   Billing    │                                  │
│  │   Service    │                                  │
│  │   Port:8004  │                                  │
│  └──────────────┘                                  │
│                                                    │
│  ┌──────────────┐                                  │
│  │   Frontend   │                                  │
│  │   Port:3000  │                                  │
│  └──────────────┘                                  │
└────────────────────────────────────────────────────┘
```

**Screenshot Placeholder:** *[Screenshot: Docker Compose deployment architecture]*

#### Kubernetes Deployment (Minikube)

```
┌────────────────────────────────────────────────────┐
│         Kubernetes Cluster (Minikube)              │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │   Patient    │  │    Doctor    │  │Appointment ││
│  │   Pods       │  │    Pods      │  │   Pods     ││
│  │  (2 replicas)│  │ (2 replicas) │  │(2 replicas)││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                    │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Billing    │  │   Frontend   │                │
│  │   Pods       │  │     Pod      │                │
│  │  (2 replicas)│  │  (1 replica) │                │
│  └──────────────┘  └──────────────┘                │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │         Ingress Controller (NGINX)           │  │
│  │         Routes: /v1/patients, /v1/doctors,   │  │
│  │         /v1/appointments, /v1/bills, /       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │  Patient DB  │  │  Doctor DB   │  │Appointment ││
│  │  (Postgres)  │  │  (Postgres)  │  │    DB      ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                    │
│  ┌──────────────┐                                  │
│  │  Billing DB  │                                  │
│  │  (Postgres)  │                                  │
│  └──────────────┘                                  │
└────────────────────────────────────────────────────┘
```

**Screenshot Placeholder:** *[Screenshot: Kubernetes deployment architecture]*

---

## 🔧 Services

### 1. Patient Service (Port 8001)

**Responsibilities:**
- CRUD operations for patients
- Search patients by name and/or phone
- PII masking in logs
- Pagination support

**Key Features:**
- Create, read, update, delete patients
- Search with pagination
- Email uniqueness validation
- PII (email, phone) masking in logs

📖 **Detailed Documentation**: [Patient Service README](./patient-service/README.md)  
📮 **Postman Collection**: [Patient Service Postman Collection](./patient-service/Patient-Service.postman_collection.json)

---

### 2. Doctor Service (Port 8002)

**Responsibilities:**
- Doctor listing and management
- Department filtering
- Slot availability checks
- Daily appointment cap validation

**Key Features:**
- List all doctors with pagination
- Filter by department
- Check slot availability (clinic hours, lead time, daily cap)
- Department-based filtering

📖 **Detailed Documentation**: [Doctor Service README](./doctor-service/README.md)  
📮 **Postman Collection**: [Doctor Service Postman Collection](./doctor-service/Doctor-Service.postman_collection.json)

---

### 3. Appointment Service (Port 8003)

**Responsibilities:**
- Book appointments
- Reschedule appointments (max 2 reschedules)
- Cancel appointments
- Complete appointments
- Mark no-show

**Key Features:**
- Book appointments with validation (patient, doctor, slot availability)
- Reschedule with business rules (max 2, cut-off time)
- Cancel with billing integration
- Complete appointments (triggers billing)
- No-show handling
- Optimistic locking for concurrency

📖 **Detailed Documentation**: [Appointment Service README](./appointment-service/README.md)  
📮 **Postman Collection**: [Appointment Service Postman Collection](./appointment-service/Appointment-Service.postman_collection.json)

---

### 4. Billing Service (Port 8004)

**Responsibilities:**
- Generate bills for completed appointments
- Compute taxes (5%)
- Handle cancellation fees
- Handle no-show fees
- Bill pagination

**Key Features:**
- Auto-generate bills for completed appointments
- Calculate consultation fee (₹500) + medication fee (₹200) + tax (5%)
- Cancellation fee calculation (full refund if >2h, 50% fee if ≤2h)
- No-show fee (100% consultation fee)
- Pagination support for bills

📖 **Detailed Documentation**: [Billing Service README](./billing-service/README.md)  
📮 **Postman Collection**: [Billing Service Postman Collection](./billing-service/Billing-Service.postman_collection.json)

---

### 5. Frontend (Port 3000)

**Responsibilities:**
- Patient management UI
- Doctor management UI
- Appointment booking UI
- Billing management UI
- Dashboard with alerts

**Key Features:**
- React-based UI with Material-UI
- Time slot selection (9 AM - 6 PM)
- Date pickers with validation
- Error handling and warnings
- Responsive design

---

## 🛠️ Tech Stack

### Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.2.0
- **Build Tool**: Maven 3.9+
- **Database**: H2 (local) / PostgreSQL (production)
- **API Documentation**: SpringDoc OpenAPI 3.0
- **Observability**: Micrometer, Prometheus metrics

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Build Tool**: npm / Create React App

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Minikube)
- **API Gateway**: Kubernetes Ingress

---

## 🚀 Step-by-Step Execution Instructions

### Prerequisites

Before starting, ensure you have the following installed:

- **Java 17+** - Backend runtime
- **Maven 3.9+** - Build tool
- **Node.js 18+** - Frontend runtime (for development)
- **Docker & Docker Compose** - Containerization
- **kubectl** - Kubernetes CLI (for Minikube deployment)
- **Minikube** - Local Kubernetes cluster (optional, for Kubernetes deployment)

**Verify installations:**
```bash
java -version
mvn -version
node -v
docker --version
docker-compose --version
kubectl version --client
minikube version  # If using Kubernetes
```

---

### Task 1: Local Development with Docker Compose

#### Step 1.1: Navigate to Project Directory

```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Screenshot Placeholder:** *[Screenshot: Terminal showing project directory]*

#### Step 1.2: Start All Services

```bash
docker-compose up -d
```

**Expected Output:**
```
Creating network "hospital-management-system_hospital-network" ... done
Creating patient-service    ... done
Creating doctor-service     ... done
Creating appointment-service ... done
Creating billing-service    ... done
Creating frontend           ... done
```

**Screenshot Placeholder:** *[Screenshot: Docker Compose starting services]*

#### Step 1.3: Verify Services are Running

```bash
docker-compose ps
```

**Expected Output:**
```
NAME                  STATUS              PORTS
patient-service       Up 30 seconds       0.0.0.0:8001->8001/tcp
doctor-service        Up 30 seconds       0.0.0.0:8002->8002/tcp
appointment-service   Up 30 seconds       0.0.0.0:8003->8003/tcp
billing-service       Up 30 seconds       0.0.0.0:8004->8004/tcp
frontend              Up 30 seconds       0.0.0.0:3000->80/tcp
```

**Screenshot Placeholder:** *[Screenshot: Docker Compose services status]*

#### Step 1.4: Check Service Health

```bash
# Check Patient Service
curl http://localhost:8001/v1/health

# Check Doctor Service
curl http://localhost:8002/v1/health

# Check Appointment Service
curl http://localhost:8003/v1/health

# Check Billing Service
curl http://localhost:8004/v1/health
```

**Expected Response:**
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

**Screenshot Placeholder:** *[Screenshot: Health check responses]*

#### Step 1.5: Access Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

**Screenshot Placeholder:** *[Screenshot: Frontend dashboard]*

#### Step 1.6: Access Swagger UI

Open Swagger UI for each service:

- **Patient Service**: http://localhost:8001/swagger-ui/index.html
- **Doctor Service**: http://localhost:8002/swagger-ui/index.html
- **Appointment Service**: http://localhost:8003/swagger-ui/index.html
- **Billing Service**: http://localhost:8004/swagger-ui/index.html

**Screenshot Placeholder:** *[Screenshot: Swagger UI for Patient Service]*

---

### Task 2: Test API Endpoints

#### Step 2.1: Create a Patient

```bash
curl -X POST http://localhost:8001/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "dob": "1990-01-15"
  }'
```

**Expected Response:**
```json
{
  "patientId": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "dob": "1990-01-15",
  "createdAt": "2024-11-08T10:30:00",
  "active": true
}
```

**Screenshot Placeholder:** *[Screenshot: Creating patient via API]*

#### Step 2.2: List All Patients

```bash
curl http://localhost:8001/v1/patients
```

**Screenshot Placeholder:** *[Screenshot: Patient list response]*

#### Step 2.3: Book an Appointment

```bash
curl -X POST http://localhost:8003/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "department": "Cardiology",
    "slotStart": "2024-11-15T10:00:00",
    "slotEnd": "2024-11-15T10:30:00"
  }'
```

**Screenshot Placeholder:** *[Screenshot: Booking appointment]*

---

### Task 3: Kubernetes Deployment (Minikube)

#### Step 3.1: Start Minikube

```bash
minikube start --memory=4096 --cpus=2
```

**Expected Output:**
```
😄  minikube v1.32.0 on Darwin 25.1.0
✨  Using the docker driver based on existing profile
🔄  Starting control plane node minikube in cluster minikube
🔄  Restarting existing docker container for "minikube" ...
```

**Screenshot Placeholder:** *[Screenshot: Minikube starting]*

#### Step 3.2: Enable Ingress Addon

```bash
minikube addons enable ingress
```

**Screenshot Placeholder:** *[Screenshot: Enabling ingress addon]*

#### Step 3.3: Configure Docker for Minikube

```bash
eval $(minikube docker-env)
```

**Screenshot Placeholder:** *[Screenshot: Configuring Docker environment]*

#### Step 3.4: Build Docker Images

```bash
# Navigate to project root
cd /Users/grahat01/Desktop/Mtech/hospital-management-system

# Build all service images
docker build -t patient-service:latest ./patient-service
docker build -t doctor-service:latest ./doctor-service
docker build -t appointment-service:latest ./appointment-service
docker build -t billing-service:latest ./billing-service
docker build -t frontend:latest ./frontend
```

**Screenshot Placeholder:** *[Screenshot: Building Docker images]*

#### Step 3.5: Deploy to Kubernetes

```bash
cd kubernetes

# Deploy ConfigMaps, Secrets, and Databases
kubectl apply -f configmaps-secrets.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=patient-db --timeout=300s
kubectl wait --for=condition=ready pod -l app=doctor-db --timeout=300s
kubectl wait --for=condition=ready pod -l app=appointment-db --timeout=300s
kubectl wait --for=condition=ready pod -l app=billing-db --timeout=300s

# Deploy services
kubectl apply -f patient-service-deployment.yaml
kubectl apply -f doctor-service-deployment.yaml
kubectl apply -f appointment-service-deployment.yaml
kubectl apply -f billing-service-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

**Screenshot Placeholder:** *[Screenshot: Deploying to Kubernetes]*

#### Step 3.6: Verify Kubernetes Deployment

```bash
# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check pods
kubectl get pods

# Check ingress
kubectl get ingress
```

**Screenshot Placeholder:** *[Screenshot: Kubernetes resources status]*

#### Step 3.7: Start Minikube Tunnel (Required for Ingress on macOS)

**Important:** On macOS, Minikube ingress requires `minikube tunnel` to be running. This must run in a separate terminal and stay active.

```bash
# Start minikube tunnel (requires sudo password)
sudo minikube tunnel
```

**Keep this terminal running!** The tunnel must stay active for ingress to work.

**Expected Output:**
```
✅  Tunnel successfully started
📌  NOTE: Please do not close this terminal as this process must stay alive for the tunnel to be accessible ...
❗  The service/ingress hospital-ingress requires privileged ports to be exposed: [80 443]
🔑  sudo permission will be asked for it.
🏃  Starting tunnel for service hospital-ingress./
```

#### Step 3.8: Configure /etc/hosts

**Update `/etc/hosts` to point to localhost (required when using tunnel):**

```bash
# Update /etc/hosts to use 127.0.0.1 (tunnel binds to localhost)
sudo sed -i '' 's/192.168.49.2 hospital.local/127.0.0.1 hospital.local/' /etc/hosts

# Or manually edit with:
sudo nano /etc/hosts
# Change: 192.168.49.2 hospital.local
# To:     127.0.0.1 hospital.local
```

**Verify the entry:**
```bash
grep hospital.local /etc/hosts
# Should show: 127.0.0.1 hospital.local
```

#### Step 3.9: Access Services via Ingress

**After tunnel is running and /etc/hosts is configured:**

```bash
# Test connection
curl -I http://hospital.local

# Access frontend in browser
open http://hospital.local
```

**Service URLs:**
- **Frontend**: http://hospital.local
- **Patient Service**: http://hospital.local/v1/patients
- **Doctor Service**: http://hospital.local/v1/doctors
- **Appointment Service**: http://hospital.local/v1/appointments
- **Billing Service**: http://hospital.local/v1/bills

**Alternative: Port Forwarding (No sudo required)**

If you prefer not to use `minikube tunnel`, you can use port forwarding:

```bash
# Port forward frontend to localhost:3000
kubectl port-forward service/frontend 3000:80

# Access at: http://localhost:3000
```

#### Step 3.10: Monitor Minikube Deployment

**Check deployment status:**
```bash
# Check all pods
kubectl get pods

# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check ingress
kubectl get ingress

# Watch pods in real-time
kubectl get pods -w
```

**View pod logs:**
```bash
# View logs for a specific pod
kubectl logs <pod-name>

# Follow logs (real-time)
kubectl logs -f <pod-name>

# View logs for a deployment
kubectl logs -f deployment/patient-service
```

**Check pod status and events:**
```bash
# Describe a pod (detailed information)
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods
kubectl top nodes
```

**Monitor Minikube status:**
```bash
# Check Minikube status
minikube status

# Check Minikube IP
minikube ip

# View Minikube dashboard (optional)
minikube dashboard
```

**Troubleshooting commands:**
```bash
# Check if tunnel is running
ps aux | grep "minikube tunnel" | grep -v grep

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50

# Check service endpoints
kubectl get endpoints

# Test service connectivity
kubectl exec -it <pod-name> -- curl http://service-name:port
```

For detailed Kubernetes deployment instructions, see [Kubernetes README](./kubernetes/README.md).

---

### Task 4: View Logs and Monitor Services

#### Step 4.1: View Service Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f patient-service
```

**Screenshot Placeholder:** *[Screenshot: Service logs]*

#### Step 4.2: Check Metrics

```bash
# Check metrics endpoint
curl http://localhost:8003/actuator/metrics
```

**Screenshot Placeholder:** *[Screenshot: Metrics endpoint]*

---

### Quick Reference Commands

**Start all services:**
```bash
docker-compose up -d
```

**Stop all services:**
```bash
docker-compose down
```

**Restart all services:**
```bash
docker-compose restart
```

**Rebuild and restart:**
```bash
docker-compose build --no-cache && docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f <service-name>
```

### Manual Setup

1. **Start services individually:**
```bash
# Patient Service
cd patient-service
mvn clean package
java -jar target/patient-service-1.0.0.jar

# Doctor Service
cd doctor-service
mvn clean package
java -jar target/doctor-service-1.0.0.jar

# Appointment Service
cd appointment-service
mvn clean package
java -jar target/appointment-service-1.0.0.jar

# Billing Service
cd billing-service
mvn clean package
java -jar target/billing-service-1.0.0.jar
```

2. **Start frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 📚 API Documentation

### OpenAPI / Swagger UI

All services provide interactive API documentation via Swagger UI:

- **Patient Service**: http://localhost:8001/swagger-ui/index.html
- **Doctor Service**: http://localhost:8002/swagger-ui/index.html
- **Appointment Service**: http://localhost:8003/swagger-ui/index.html
- **Billing Service**: http://localhost:8004/swagger-ui/index.html

### OpenAPI JSON Endpoints

- **Patient Service**: http://localhost:8001/v3/api-docs
- **Doctor Service**: http://localhost:8002/v3/api-docs
- **Appointment Service**: http://localhost:8003/v3/api-docs
- **Billing Service**: http://localhost:8004/v3/api-docs


### Example API Calls

**Create Patient:**
```bash
curl -X POST http://localhost:8001/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "dob": "1990-01-01"
  }'
```

**Book Appointment:**
```bash
curl -X POST http://localhost:8003/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "department": "Cardiology",
    "slotStart": "2024-01-15T10:00:00",
    "slotEnd": "2024-01-15T10:30:00"
  }'
```

---

## 📖 Detailed Documentation

### Service Documentation

- [Patient Service Documentation](./patient-service/README.md)
- [Doctor Service Documentation](./doctor-service/README.md)
- [Appointment Service Documentation](./appointment-service/README.md)
- [Billing Service Documentation](./billing-service/README.md)

**Postman Collections:**
- [Patient Service Postman Collection](./patient-service/Patient-Service.postman_collection.json)
- [Doctor Service Postman Collection](./doctor-service/Doctor-Service.postman_collection.json)
- [Appointment Service Postman Collection](./appointment-service/Appointment-Service.postman_collection.json)
- [Billing Service Postman Collection](./billing-service/Billing-Service.postman_collection.json)

### Architecture Documentation

- [Database Architecture](./docs/DATABASE_ARCHITECTURE.md) - ER diagrams, context maps, database-per-service pattern

### Kubernetes Documentation

- [Kubernetes README](./kubernetes/README.md) - Kubernetes deployment guide

### Seed Data

- [Seed Data README](./seed-data/README.md) - Seed data loading instructions

---

## 🚢 Deployment

### Docker Compose

The `docker-compose.yml` file includes all services with health checks:

**Basic Commands:**
```bash
docker-compose up -d              # Start all services
docker-compose ps                 # Check service status
docker-compose logs -f <service>  # View logs
docker-compose down               # Stop all services
docker-compose restart            # Restart all services
```

**Build and Restart:**
```bash
# Run from project root directory
cd hospital-management-system

# Rebuild all services (no cache) and restart
docker-compose build --no-cache && docker-compose up -d

# Rebuild specific service and restart
docker-compose build --no-cache patient-service && docker-compose up -d patient-service
```

📖 **For comprehensive deployment commands** (build, restart, individual services, troubleshooting), see [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md).

### Kubernetes (Minikube)

1. **Start Minikube:**
```bash
minikube start
```

2. **Apply Kubernetes manifests:**
```bash
kubectl apply -f kubernetes/
```

3. **Check deployments:**
```bash
kubectl get deployments
kubectl get services
kubectl get pods
```

4. **Access services:**
```bash
minikube service <service-name>
```

For detailed Kubernetes deployment instructions, see [Kubernetes README](./kubernetes/README.md).

---

## 📊 Monitoring & Observability

### Health Checks

All services expose enhanced health check endpoints at `/v1/health` that include:

- **Service Information**: Status, service name, port
- **API Endpoints**: Swagger UI, OpenAPI docs, H2 Console
- **Monitoring Endpoints**: Actuator health, metrics, Prometheus (Appointment & Billing)
- **Custom Metrics**: Service-specific metrics (Appointment & Billing services)
- **Logging Information**: Format, correlation IDs, PII masking (Patient service)
- **Available API Endpoints**: Summary of all GET, POST, PUT, DELETE endpoints

**Health Check URLs:**
- **Patient Service**: http://localhost:8001/v1/health
- **Doctor Service**: http://localhost:8002/v1/health
- **Appointment Service**: http://localhost:8003/v1/health
- **Billing Service**: http://localhost:8004/v1/health

**Example Response (Patient Service):**
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

### Metrics

Services expose metrics at `/actuator/metrics`:

- **Appointment Service**: Custom metrics (`appointments_created_total`, `appointment_booking_latency_ms`)
- **Billing Service**: Custom metrics (`bills_created_total`, `bill_creation_latency_ms`)

### Logging

- **Format**: Structured JSON logging
- **Correlation IDs**: All requests include correlation IDs for tracing
- **PII Masking**: Patient email and phone are masked in logs (Patient Service)

---

## 📋 Business Rules

### Appointment Booking

- **Clinic Hours**: Appointments must be between 9 AM and 6 PM
- **Lead Time**: Appointments must be at least 2 hours from current time
- **Daily Cap**: Maximum 20 appointments per doctor per day (configurable)
- **Slot Collision**: No overlapping appointments for the same doctor
- **Patient Validation**: Patient must exist and be active
- **Doctor Validation**: Doctor must exist and be available

### Rescheduling

- **Maximum Reschedules**: Maximum 2 reschedules per appointment
- **Cut-off Time**: Must reschedule at least 1 hour before original appointment start
- **New Slot Lead Time**: New slot must be at least 2 hours from now
- **Clinic Hours**: New slot must be within clinic hours (9 AM - 6 PM)

### Cancellation

- **Cut-off Time**: Must cancel at least 1 hour before appointment start
- **Cancellation Fee**:
  - Full refund if cancelled >2 hours before appointment
  - 50% cancellation fee if cancelled ≤2 hours before appointment

### No-Show

- **Fee**: 100% consultation fee charged
- **Billing**: Bill is created with no-show fee

### Billing

- **Bill Generation**: Automatically triggered when appointment is completed
- **Consultation Fee**: ₹500.00
- **Medication Fee**: ₹200.00 (estimated)
- **Tax**: 5% on subtotal
- **Total**: Consultation + Medication + Tax

---

## 📁 Project Structure

```
hospital-management-system/
├── patient-service/          # Patient microservice
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── doctor-service/           # Doctor microservice
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── appointment-service/      # Appointment microservice
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── billing-service/         # Billing microservice
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── kubernetes/              # Kubernetes manifests
│   ├── configmaps-secrets.yaml
│   ├── deployments.yaml
│   ├── services.yaml
│   └── ingress.yaml
├── docs/                    # Documentation
│   ├── DATABASE_ARCHITECTURE.md
│   ├── patient-service/
│   ├── doctor-service/
│   ├── appointment-service/
│   └── billing-service/
├── seed-data/               # Seed data files
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # This file
```

---

## 🔗 Additional Resources

- **Database Architecture**: [docs/DATABASE_ARCHITECTURE.md](./docs/DATABASE_ARCHITECTURE.md)
- **Kubernetes Deployment**: [kubernetes/README.md](./kubernetes/README.md)
- **Seed Data**: [seed-data/README.md](./seed-data/README.md)

---

## 📝 License

This project is for educational purposes.

---

## 🤝 Contributing

This is an academic project. For questions or issues, please refer to the detailed service documentation.

---

**Last Updated**: November 2024  
**Version**: 1.0.0
