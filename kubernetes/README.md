# Kubernetes Deployment Guide - Minikube

Complete step-by-step guide for deploying the Hospital Management System to Minikube.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Deployment](#step-by-step-deployment)
3. [Accessing Services](#accessing-services)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Cleanup](#cleanup)

---

## 🔧 Prerequisites

### Required Software

1. **Minikube** - Local Kubernetes cluster
   ```bash
   # Install Minikube (macOS)
   brew install minikube
   
   # Or download from: https://minikube.sigs.k8s.io/docs/start/
   ```

2. **kubectl** - Kubernetes command-line tool
   ```bash
   # Install kubectl (macOS)
   brew install kubectl
   
   # Or download from: https://kubernetes.io/docs/tasks/tools/
   ```

3. **Docker** - Container runtime
   ```bash
   # Verify Docker is running
   docker --version
   ```

### Verify Installation

```bash
# Check Minikube version
minikube version

# Check kubectl version
kubectl version --client

# Check Docker version
docker --version
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Start Minikube

**Start Minikube cluster:**
```bash
# Start Minikube with default settings
minikube start

# Or with specific resources (recommended)
minikube start --memory=4096 --cpus=2

# Check Minikube status
minikube status
```

**Expected output:**
```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

**Enable required addons:**
```bash
# Enable ingress addon (for routing)
minikube addons enable ingress

# Verify ingress is enabled
minikube addons list | grep ingress
```

---

### Step 2: Configure Docker for Minikube

**Point Docker to Minikube's Docker daemon:**
```bash
# This allows Minikube to use locally built images
eval $(minikube docker-env)

# Verify you're using Minikube's Docker
docker ps
```

**Note:** Keep this terminal session open, or run `eval $(minikube docker-env)` in each new terminal.

---

### Step 3: Build Docker Images

**Navigate to project root:**
```bash
cd /Users/grahat01/Desktop/Mtech/hospital-management-system
```

**Build all service images:**
```bash
# Build Patient Service
docker build -t patient-service:latest ./patient-service

# Build Doctor Service
docker build -t doctor-service:latest ./doctor-service

# Build Appointment Service
docker build -t appointment-service:latest ./appointment-service

# Build Billing Service
docker build -t billing-service:latest ./billing-service

# Build Frontend
docker build -t frontend:latest ./frontend
```

**Verify images are built:**
```bash
docker images | grep -E "patient-service|doctor-service|appointment-service|billing-service|frontend"
```

**Expected output:**
```
patient-service       latest    <image-id>   <time>   <size>
doctor-service        latest    <image-id>   <time>   <size>
appointment-service   latest    <image-id>   <time>   <size>
billing-service       latest    <image-id>   <time>   <size>
frontend              latest    <image-id>   <time>   <size>
```

---

### Step 4: Deploy ConfigMaps, Secrets, and Databases

**Apply ConfigMaps, Secrets, PVCs, and Database deployments:**
```bash
cd kubernetes
kubectl apply -f configmaps-secrets.yaml
```

**Wait for databases to be ready:**
```bash
# Wait for Patient DB
kubectl wait --for=condition=ready pod -l app=patient-db --timeout=300s

# Wait for Doctor DB
kubectl wait --for=condition=ready pod -l app=doctor-db --timeout=300s

# Wait for Appointment DB
kubectl wait --for=condition=ready pod -l app=appointment-db --timeout=300s

# Wait for Billing DB
kubectl wait --for=condition=ready pod -l app=billing-db --timeout=300s
```

**Check database pods:**
```bash
kubectl get pods -l app=patient-db
kubectl get pods -l app=doctor-db
kubectl get pods -l app=appointment-db
kubectl get pods -l app=billing-db
```

**Expected output:**
```
NAME          READY   STATUS    RESTARTS   AGE
patient-db-*  1/1     Running   0          2m
doctor-db-*   1/1     Running   0          2m
appointment-db-* 1/1   Running   0          2m
billing-db-*  1/1     Running   0          2m
```

---

### Step 5: Deploy Services

**Deploy all services:**
```bash
# Deploy Patient Service
kubectl apply -f patient-service-deployment.yaml

# Deploy Doctor Service
kubectl apply -f doctor-service-deployment.yaml

# Deploy Appointment Service
kubectl apply -f appointment-service-deployment.yaml

# Deploy Billing Service
kubectl apply -f billing-service-deployment.yaml

# Deploy Frontend
kubectl apply -f frontend-deployment.yaml
```

**Or deploy all at once:**
```bash
kubectl apply -f patient-service-deployment.yaml \
              -f doctor-service-deployment.yaml \
              -f appointment-service-deployment.yaml \
              -f billing-service-deployment.yaml \
              -f frontend-deployment.yaml
```

---

### Step 6: Deploy Ingress

**Deploy Ingress configuration:**
```bash
kubectl apply -f ingress.yaml
```

**Wait for Ingress to be ready:**
```bash
kubectl wait --for=condition=ready ingress/hospital-ingress --timeout=300s
```

### Step 7: Start Minikube Tunnel (Required for Ingress on macOS)

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

**Note:** The tunnel binds to `127.0.0.1` (localhost), so `/etc/hosts` must point to `127.0.0.1`, not the Minikube IP.

---

### Step 8: Configure /etc/hosts

**Update `/etc/hosts` to point to localhost (required when using tunnel):**

```bash
# Get Minikube IP (for reference)
minikube ip

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

### Step 9: Verify Deployment

**Check all deployments:**
```bash
kubectl get deployments
```

**Expected output:**
```
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
patient-service      2/2     2            2           2m
doctor-service       2/2     2            2           2m
appointment-service  2/2     2            2           2m
billing-service      2/2     2            2           2m
frontend             1/1     1            1           2m
patient-db           1/1     1            1           5m
doctor-db            1/1     1            1           5m
appointment-db       1/1     1            1           5m
billing-db           1/1     1            1           5m
```

**Check all services:**
```bash
kubectl get services
```

**Expected output:**
```
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
patient-service      ClusterIP   10.96.x.x      <none>        8001/TCP   2m
doctor-service       ClusterIP   10.96.x.x      <none>        8002/TCP   2m
appointment-service  ClusterIP   10.96.x.x      <none>        8003/TCP   2m
billing-service      ClusterIP   10.96.x.x      <none>        8004/TCP   2m
frontend             ClusterIP   10.96.x.x      <none>        80/TCP     2m
patient-db           ClusterIP   10.96.x.x      <none>        5432/TCP   5m
doctor-db            ClusterIP   10.96.x.x      <none>        5432/TCP   5m
appointment-db       ClusterIP   10.96.x.x      <none>        5432/TCP   5m
billing-db           ClusterIP   10.96.x.x      <none>        5432/TCP   5m
```

**Check all pods:**
```bash
kubectl get pods
```

**Expected output:**
```
NAME                                  READY   STATUS    RESTARTS   AGE
patient-service-xxxxx-xxxxx           1/1     Running   0          2m
doctor-service-xxxxx-xxxxx            1/1     Running   0          2m
appointment-service-xxxxx-xxxxx       1/1     Running   0          2m
billing-service-xxxxx-xxxxx          1/1     Running   0          2m
frontend-xxxxx-xxxxx                  1/1     Running   0          2m
patient-db-xxxxx                      1/1     Running   0          5m
doctor-db-xxxxx                       1/1     Running   0          5m
appointment-db-xxxxx                  1/1     Running   0          5m
billing-db-xxxxx                      1/1     Running   0          5m
```

**Check Ingress:**
```bash
kubectl get ingress
```

**Expected output:**
```
NAME              CLASS   HOSTS            ADDRESS        PORTS   AGE
hospital-ingress  nginx   hospital.local   <minikube-ip>  80      2m
```

---

## 🌐 Accessing Services

### Method 1: Using Ingress with Minikube Tunnel (Recommended for macOS)

**Prerequisites:**
1. Minikube tunnel must be running: `sudo minikube tunnel`
2. `/etc/hosts` must point to `127.0.0.1` (not Minikube IP)

**Configure `/etc/hosts`:**
```bash
# Update /etc/hosts to use 127.0.0.1 (tunnel binds to localhost)
sudo sed -i '' 's/192.168.49.2 hospital.local/127.0.0.1 hospital.local/' /etc/hosts

# Or manually edit with:
sudo nano /etc/hosts
# Change: 192.168.49.2 hospital.local
# To:     127.0.0.1 hospital.local
```

**Verify configuration:**
```bash
grep hospital.local /etc/hosts
# Should show: 127.0.0.1 hospital.local
```

**Test connection:**
```bash
curl -I http://hospital.local
# Should return: HTTP/1.1 200 OK
```

**Access services:**
- **Frontend**: http://hospital.local
- **Patient Service**: http://hospital.local/v1/patients
- **Doctor Service**: http://hospital.local/v1/doctors
- **Appointment Service**: http://hospital.local/v1/appointments
- **Billing Service**: http://hospital.local/v1/bills

**Health Checks:**
- Patient Service: http://hospital.local/v1/health
- Doctor Service: http://hospital.local/v1/health
- Appointment Service: http://hospital.local/v1/health
- Billing Service: http://hospital.local/v1/health

**Swagger UI:**
- Patient Service: http://hospital.local/swagger-ui/index.html (if configured)
- Doctor Service: http://hospital.local/swagger-ui/index.html
- Appointment Service: http://hospital.local/swagger-ui/index.html
- Billing Service: http://hospital.local/swagger-ui/index.html

---

### Method 2: Using Port Forwarding

**Port forward services to localhost:**

**Terminal 1 - Patient Service:**
```bash
kubectl port-forward service/patient-service 8001:8001
```

**Terminal 2 - Doctor Service:**
```bash
kubectl port-forward service/doctor-service 8002:8002
```

**Terminal 3 - Appointment Service:**
```bash
kubectl port-forward service/appointment-service 8003:8003
```

**Terminal 4 - Billing Service:**
```bash
kubectl port-forward service/billing-service 8004:8004
```

**Terminal 5 - Frontend:**
```bash
kubectl port-forward service/frontend 3000:80
```

**Access services:**
- Frontend: http://localhost:3000
- Patient Service: http://localhost:8001/v1/health
- Doctor Service: http://localhost:8002/v1/health
- Appointment Service: http://localhost:8003/v1/health
- Billing Service: http://localhost:8004/v1/health

---

### Method 3: Using NodePort (Alternative)

**Update service type to NodePort in deployment files, then:**
```bash
# Get NodePort
kubectl get services

# Access via Minikube IP
minikube service patient-service --url
minikube service doctor-service --url
minikube service appointment-service --url
minikube service billing-service --url
minikube service frontend --url
```

---

## 📊 Monitoring Minikube Deployment

### Check Deployment Status

**Basic status checks:**
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

**Detailed pod information:**
```bash
# Get pods with more details
kubectl get pods -o wide

# Describe a specific pod
kubectl describe pod <pod-name>

# Check pod events
kubectl describe pod <pod-name> | grep -A 10 Events
```

### View Pod Logs

**View logs:**
```bash
# View logs for a specific pod
kubectl logs <pod-name>

# Follow logs (real-time)
kubectl logs -f <pod-name>

# View logs for a deployment
kubectl logs -f deployment/patient-service

# View logs for all pods in a deployment
kubectl logs -f -l app=patient-service
```

**View logs with timestamps:**
```bash
# View logs with timestamps
kubectl logs <pod-name> --timestamps

# View last N lines
kubectl logs <pod-name> --tail=50

# View logs from a specific time
kubectl logs <pod-name> --since=10m
```

### Monitor Resource Usage

**Check resource consumption:**
```bash
# Check pod resource usage
kubectl top pods

# Check node resource usage
kubectl top nodes

# Check resource usage for specific namespace
kubectl top pods --all-namespaces
```

### Monitor Minikube Status

**Check Minikube cluster status:**
```bash
# Check Minikube status
minikube status

# Check Minikube IP
minikube ip

# View Minikube dashboard (opens in browser)
minikube dashboard

# Check Minikube addons
minikube addons list

# Check if tunnel is running
ps aux | grep "minikube tunnel" | grep -v grep
```

### Check Service Endpoints

**Verify service connectivity:**
```bash
# Check service endpoints
kubectl get endpoints

# Check endpoints for a specific service
kubectl get endpoints patient-service

# Test service connectivity from a pod
kubectl exec -it <pod-name> -- curl http://service-name:port

# Test service health endpoint
kubectl exec -it <pod-name> -- curl http://localhost:8001/v1/health
```

### Monitor Events

**View cluster events:**
```bash
# View all events
kubectl get events

# View events sorted by time
kubectl get events --sort-by='.lastTimestamp'

# View events for a specific resource
kubectl get events --field-selector involvedObject.name=<pod-name>

# Watch events in real-time
kubectl get events --watch
```

### Check Ingress Status

**Monitor ingress:**
```bash
# Check ingress status
kubectl get ingress

# Describe ingress
kubectl describe ingress hospital-ingress

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50

# Check ingress controller pods
kubectl get pods -n ingress-nginx
```

---

## ✅ Verification

### Check Service Health

**Using Ingress:**
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Check Patient Service
curl http://$MINIKUBE_IP/v1/health -H "Host: hospital.local"

# Check Doctor Service
curl http://$MINIKUBE_IP/v1/health -H "Host: hospital.local"

# Check Appointment Service
curl http://$MINIKUBE_IP/v1/health -H "Host: hospital.local"

# Check Billing Service
curl http://$MINIKUBE_IP/v1/health -H "Host: hospital.local"
```

**Using Port Forwarding:**
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

**Expected response:**
```json
{
  "status": "healthy",
  "service": "patient-service"
}
```

### Test API Endpoints

**Create a patient (using Ingress):**
```bash
MINIKUBE_IP=$(minikube ip)

curl -X POST http://$MINIKUBE_IP/v1/patients \
  -H "Host: hospital.local" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "dob": "1990-01-15"
  }'
```

**List doctors:**
```bash
curl http://$MINIKUBE_IP/v1/doctors \
  -H "Host: hospital.local"
```

---

## 🔍 Troubleshooting

### Check Pod Logs

**View logs for a specific pod:**
```bash
# Get pod name
kubectl get pods

# View logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# View logs for a deployment
kubectl logs -f deployment/patient-service
```

### Describe Pods

**Get detailed pod information:**
```bash
kubectl describe pod <pod-name>
```

**Check for errors:**
```bash
kubectl describe pod <pod-name> | grep -A 10 Events
```

### Check Events

**View cluster events:**
```bash
kubectl get events --sort-by='.lastTimestamp'
```

### Check Service Endpoints

**Verify service endpoints:**
```bash
kubectl get endpoints
```

### Common Issues

**Issue: Pods in CrashLoopBackOff**
```bash
# Check pod logs
kubectl logs <pod-name>

# Check pod description
kubectl describe pod <pod-name>

# Common causes:
# - Database not ready
# - Wrong environment variables
# - Image pull errors
```

**Issue: Services not accessible**
```bash
# Check if services are running
kubectl get services

# Check if pods are ready
kubectl get pods

# Verify ingress is enabled
minikube addons list | grep ingress

# Check ingress status
kubectl get ingress
```

**Issue: Database connection errors**
```bash
# Check database pods
kubectl get pods -l app=patient-db

# Check database logs
kubectl logs -l app=patient-db

# Verify database service
kubectl get service patient-db
```

**Issue: Images not found**
```bash
# Verify images are built in Minikube
eval $(minikube docker-env)
docker images | grep patient-service

# Rebuild images if needed
docker build -t patient-service:latest ./patient-service
```

---

## 🧹 Cleanup

### Delete All Resources

**Delete all deployments and services:**
```bash
cd kubernetes

# Delete all resources
kubectl delete -f .

# Or delete individually
kubectl delete -f patient-service-deployment.yaml
kubectl delete -f doctor-service-deployment.yaml
kubectl delete -f appointment-service-deployment.yaml
kubectl delete -f billing-service-deployment.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f ingress.yaml
kubectl delete -f configmaps-secrets.yaml
```

**Verify all resources are deleted:**
```bash
kubectl get all
```

### Stop Minikube

**Stop Minikube cluster:**
```bash
minikube stop
```

**Delete Minikube cluster (complete cleanup):**
```bash
minikube delete
```

**Reset Docker environment:**
```bash
# Exit Minikube Docker environment
eval $(minikube docker-env -u)
```

---

## 📊 Resource Requirements

### Minikube Resources

**Recommended Minikube configuration:**
```bash
minikube start --memory=4096 --cpus=2
```

### Service Resources

Each service deployment includes:
- **Replicas**: 2 (for high availability)
- **Memory**: 512Mi requests, 1Gi limits
- **CPU**: 250m requests, 500m limits
- **Health Probes**: Liveness and Readiness probes configured
- **Persistent Storage**: 1Gi PVC per database

---

## 🔐 Configuration

### Environment Variables

Services are configured via ConfigMaps and Secrets:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Service port
- Service URLs for inter-service communication

### Secrets

All database credentials are stored in Kubernetes Secrets:
- `patient-secret`
- `doctor-secret`
- `appointment-secret`
- `billing-secret`

**Default credentials (change for production):**
- Username: `postgres`
- Password: `postgres`

**Update secrets:**
```bash
kubectl create secret generic patient-secret \
  --from-literal=database-user=newuser \
  --from-literal=database-password=newpassword \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 📝 Quick Reference Commands

### Start Minikube and Deploy
```bash
# Start Minikube (with recommended resources)
minikube start --memory=4096 --cpus=2

# Check Minikube status
minikube status

# Enable ingress addon
minikube addons enable ingress

# Configure Docker for Minikube
eval $(minikube docker-env)

# Build all Docker images
docker build -t patient-service:latest ./patient-service
docker build -t doctor-service:latest ./doctor-service
docker build -t appointment-service:latest ./appointment-service
docker build -t billing-service:latest ./billing-service
docker build -t frontend:latest ./frontend

# Deploy ConfigMaps, Secrets, and Databases
cd kubernetes
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

# Start Minikube tunnel (REQUIRED for ingress on macOS - keep running!)
sudo minikube tunnel

# Configure /etc/hosts (in another terminal)
sudo sed -i '' 's/192.168.49.2 hospital.local/127.0.0.1 hospital.local/' /etc/hosts
```

### Status Checks
```bash
# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check pods
kubectl get pods

# Check pods with details
kubectl get pods -o wide

# Check ingress
kubectl get ingress

# Watch pods in real-time
kubectl get pods -w
```

### Monitor and Debug
```bash
# View pod logs
kubectl logs <pod-name>

# Follow logs (real-time)
kubectl logs -f <pod-name>

# View logs for a deployment
kubectl logs -f deployment/patient-service

# Describe a pod (detailed info)
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods
kubectl top nodes

# Check Minikube status
minikube status

# Check if tunnel is running
ps aux | grep "minikube tunnel" | grep -v grep
```

### Access Services
```bash
# Get Minikube IP
minikube ip

# Test connection
curl -I http://hospital.local

# Port forward (alternative to tunnel)
kubectl port-forward service/frontend 3000:80

# Access at: http://localhost:3000
```

### Cleanup
```bash
# Delete all Kubernetes resources
cd kubernetes
kubectl delete -f .

# Stop Minikube tunnel (if running)
pkill -f "minikube tunnel"

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

---

## 🚀 Production Considerations

1. **Change default passwords** in Secrets
2. **Use external databases** instead of in-cluster PostgreSQL
3. **Enable TLS/HTTPS** in Ingress
4. **Configure resource limits** based on actual usage
5. **Set up monitoring** (Prometheus, Grafana)
6. **Configure backup** for databases
7. **Use secrets management** (e.g., HashiCorp Vault)
8. **Enable network policies** for security
9. **Use persistent volumes** for production data
10. **Configure autoscaling** based on load

---

**Last Updated**: November 2024  
**Version**: 1.0.0
