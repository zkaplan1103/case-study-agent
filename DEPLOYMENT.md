# PartSelect Chat - Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2
- DeepSeek API key (required for backend AI functionality)

## Quick Start (Local Development)

1. **Clone and prepare environment:**
   ```bash
   cd case-study-main
   cp .env.example .env
   # Edit .env file and add your DEEPSEEK_API_KEY
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health checks: http://localhost/health and http://localhost:3001/health

## Manual Docker Build

### Backend Only:
```bash
cd backend
docker build -t partselect-backend .
docker run -p 3001:3001 -e DEEPSEEK_API_KEY="your_key_here" partselect-backend
```

### Frontend Only:
```bash
cd frontend
docker build -t partselect-frontend --build-arg REACT_APP_API_URL=http://localhost:3001 .
docker run -p 80:80 partselect-frontend
```

## Production Deployment Options

### 1. Cloud Container Services

#### AWS ECS/Fargate:
- Push images to ECR
- Use ECS service definitions
- Set environment variables via ECS task definitions
- Use Application Load Balancer for traffic distribution

#### Google Cloud Run:
```bash
# Build and push images
docker build -t gcr.io/PROJECT_ID/partselect-backend ./backend
docker build -t gcr.io/PROJECT_ID/partselect-frontend ./frontend
docker push gcr.io/PROJECT_ID/partselect-backend
docker push gcr.io/PROJECT_ID/partselect-frontend

# Deploy services
gcloud run deploy partselect-backend --image gcr.io/PROJECT_ID/partselect-backend --platform managed
gcloud run deploy partselect-frontend --image gcr.io/PROJECT_ID/partselect-frontend --platform managed
```

#### Azure Container Instances:
```bash
# Create resource group
az group create --name partselect-rg --location eastus

# Deploy backend
az container create --resource-group partselect-rg --name partselect-backend \
  --image partselect-backend:latest --ports 3001 \
  --environment-variables DEEPSEEK_API_KEY="your_key"

# Deploy frontend  
az container create --resource-group partselect-rg --name partselect-frontend \
  --image partselect-frontend:latest --ports 80
```

### 2. Kubernetes Deployment

Create Kubernetes manifests:

**backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: partselect-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: partselect-backend
  template:
    metadata:
      labels:
        app: partselect-backend
    spec:
      containers:
      - name: backend
        image: partselect-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DEEPSEEK_API_KEY
          valueFrom:
            secretKeyRef:
              name: deepseek-secret
              key: api-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: partselect-backend-service
spec:
  selector:
    app: partselect-backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

### 3. VPS/Dedicated Server

Using Docker Compose with production overrides:

**docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  backend:
    environment:
      - NODE_ENV=production
      - CORS_ORIGINS=https://yourdomain.com
    restart: always
    
  frontend:
    build:
      args:
        - REACT_APP_API_URL=https://api.yourdomain.com
    restart: always
    
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

Deploy:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Environment Variables Reference

### Backend Required:
- `DEEPSEEK_API_KEY` - Your DeepSeek API key (required)

### Backend Optional:
- `NODE_ENV` - Environment mode (default: development)
- `PORT` - Server port (default: 3001)
- `CORS_ORIGINS` - Allowed origins (default: http://localhost:3000)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- `DEEPSEEK_BASE_URL` - DeepSeek API URL (default: https://api.deepseek.com)

### Frontend Build-time:
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3001)

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CORS**: Configure proper origins for production
3. **HTTPS**: Use SSL/TLS in production
4. **Container Security**: Images run as non-root users
5. **Network**: Use Docker networks to isolate services

## Monitoring & Health Checks

Both services include health check endpoints:
- Backend: `GET /health`
- Frontend: `GET /health`

Health checks are configured in Docker Compose and Kubernetes manifests.

## Troubleshooting

### Common Issues:

1. **Backend fails to start:**
   - Check DEEPSEEK_API_KEY is set
   - Verify internet connectivity for DeepSeek API

2. **Frontend can't reach backend:**
   - Check REACT_APP_API_URL build argument
   - Verify CORS_ORIGINS includes frontend URL

3. **Permission denied errors:**
   - Ensure Docker daemon is running
   - Check file permissions in project directory

### Logs:
```bash
# View logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs
docker-compose logs -f
```

## Scaling

### Horizontal Scaling:
```bash
# Scale backend to 3 instances
docker-compose up --scale backend=3

# Use load balancer (nginx, HAProxy, cloud LB)
```

### Resource Limits:
Add to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Backup & Recovery

Since the application is stateless with no database:
- **Code**: Keep in version control
- **Config**: Backup environment variables securely
- **Images**: Store in container registry
- **No data backup needed** - all data is static/hardcoded