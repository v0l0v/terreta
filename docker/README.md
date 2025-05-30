# 🐳 Docker Deployment

This folder contains all Docker-related files for containerizing and deploying the Treasures application.

## 📁 Files Overview

- **`Dockerfile`** - Multi-stage Docker build configuration
- **`nginx.docker.conf`** - Nginx configuration optimized for containers
- **`docker-compose.yml`** - Full compose with SSL support
- **`docker-compose.prod.yml`** - Simple production deployment
- **`docker-compose.ssl.yml`** - SSL-enabled deployment with Let's Encrypt
- **`deploy-docker.sh`** - Automated deployment script for Digital Ocean
- **`test-docker.sh`** - Local testing script
- **`.dockerignore`** - Files to exclude from Docker build

## 🚀 Quick Start

### Local Testing
```bash
# Test the container locally (from project root)
./docker/test-docker.sh

# Rebuild and test
./docker/test-docker.sh --rebuild

# Stop local test
./docker/test-docker.sh --stop
```

### Deploy to Digital Ocean Droplet
```bash
# Basic deployment
./docker/deploy-docker.sh YOUR_DROPLET_IP

# With custom domain
./docker/deploy-docker.sh YOUR_DROPLET_IP treasures.yourdomain.com

# With SSL (recommended for production)
./docker/deploy-docker.sh YOUR_DROPLET_IP treasures.yourdomain.com --ssl
```

## 🛠️ Manual Docker Commands

### Build Image
```bash
# From project root
docker build -t treasures-app -f docker/Dockerfile .
```

### Run Locally
```bash
docker run -p 8080:80 treasures-app
```

### Production Deployment
```bash
# Simple deployment (from docker/ folder)
docker compose -f docker-compose.prod.yml up -d

# With SSL
DOMAIN=treasures.yourdomain.com EMAIL=admin@yourdomain.com \
docker compose -f docker-compose.ssl.yml --profile proxy --profile ssl up -d
```

## 🔧 Container Features

✅ **Multi-stage build** - Optimized image size  
✅ **Security hardened** - Non-root user, security headers  
✅ **Health checks** - Automatic container monitoring  
✅ **Nginx optimizations** - Gzip, caching, SPA routing  
✅ **Nostr protocol support** - WebSocket connections configured  
✅ **PWA support** - Service worker and manifest handling  
✅ **SSL automation** - Let's Encrypt certificates  
✅ **Resource limits** - Memory management  

## 🌐 Access Points

After deployment:
- **HTTP**: `http://your-droplet-ip`
- **HTTPS**: `https://your-domain` (if SSL enabled)
- **Health Check**: `http://your-droplet-ip/health`

## 🔍 Container Management

On your droplet after deployment:
```bash
# View status
cd /opt/treasures && docker compose ps

# View logs
docker compose logs -f treasures

# Update application
./docker/deploy-docker.sh YOUR_DROPLET_IP

# Stop services
docker compose down

# Restart services
docker compose restart
```

## 📊 Docker Compose Profiles

- **Default**: Basic Treasures app container
- **proxy**: Adds nginx-proxy for multi-domain support
- **ssl**: Adds Let's Encrypt SSL certificate automation

## 🔒 Security Features

- Non-root container execution
- Security headers (XSS, CSRF protection)  
- Content Security Policy for Nostr relays
- UFW firewall configuration
- Automatic security updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Let's Encrypt │◄──►│ nginx-proxy  │◄──►│  Treasures  │
│   (SSL Certs)   │    │ (Reverse     │    │    App      │
└─────────────────┘    │  Proxy)      │    │ (React SPA) │
                       └──────────────┘    └─────────────┘
                              │                    │
                       ┌──────▼──────┐     ┌──────▼──────┐
                       │   Port 443  │     │   Port 80   │
                       │   (HTTPS)   │     │   (HTTP)    │
                       └─────────────┘     └─────────────┘
```

## 🐛 Troubleshooting

**Container won't start:**
```bash
docker logs treasures-app
```

**Build failures:**
```bash
docker build -t treasures-app -f docker/Dockerfile . --no-cache --progress=plain
```

**SSL issues:**
```bash
docker logs letsencrypt
docker logs nginx-proxy
```

**Health check failures:**
```bash
docker exec treasures-app wget --spider http://localhost:80/health
```