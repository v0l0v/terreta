#!/bin/bash

# Treasures Container Deployment Script for Digital Ocean
# Usage: ./docker/deploy-docker.sh [droplet-ip] [options]

set -e

# Get the project root directory (parent of docker folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

DROPLET_IP=$1
DOMAIN=${2:-$DROPLET_IP}
COMPOSE_FILE="docker-compose.prod.yml"
IMAGE_NAME="treasures-app"
CONTAINER_NAME="treasures-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Help function
show_help() {
    echo "Usage: $0 <droplet-ip> [domain] [options]"
    echo ""
    echo "Run from project root: ./docker/deploy-docker.sh <droplet-ip>"
    echo ""
    echo "Options:"
    echo "  --ssl           Enable SSL with nginx-proxy and Let's Encrypt"
    echo "  --build-only    Only build the image locally"
    echo "  --deploy-only   Deploy without building (assumes image exists on droplet)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.1.100"
    echo "  $0 192.168.1.100 treasures.example.com"
    echo "  $0 192.168.1.100 treasures.example.com --ssl"
    echo "  $0 192.168.1.100 --build-only"
}

# Parse arguments
SSL_ENABLED=false
BUILD_ONLY=false
DEPLOY_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --ssl)
            SSL_ENABLED=true
            COMPOSE_FILE="docker-compose.yml"
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --deploy-only)
            DEPLOY_ONLY=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            if [ -z "$DROPLET_IP" ]; then
                DROPLET_IP=$1
            elif [ -z "$DOMAIN" ] || [ "$DOMAIN" = "$DROPLET_IP" ]; then
                DOMAIN=$1
            fi
            shift
            ;;
    esac
done

if [ -z "$DROPLET_IP" ] && [ "$BUILD_ONLY" = false ]; then
    error "Droplet IP is required unless using --build-only"
    echo ""
    show_help
    exit 1
fi

log "🚀 Starting Treasures container deployment"
log "📍 Target: $DROPLET_IP"
log "🌐 Domain: $DOMAIN"
log "🐳 Compose: $COMPOSE_FILE"
log "🔒 SSL: $SSL_ENABLED"

# Build image locally
if [ "$DEPLOY_ONLY" = false ]; then
    log "📦 Building Docker image locally..."
    cd "$PROJECT_ROOT"
    docker build -t $IMAGE_NAME -f docker/Dockerfile . --no-cache
    
    if [ "$BUILD_ONLY" = true ]; then
        log "✅ Build complete! Image: $IMAGE_NAME"
        log "🏷️  Run locally: docker run -p 80:80 $IMAGE_NAME"
        exit 0
    fi
fi

# Prepare deployment files
log "📋 Preparing deployment files..."
TEMP_DIR=$(mktemp -d)
cp "$SCRIPT_DIR/$COMPOSE_FILE" "$TEMP_DIR/docker-compose.yml"
cp "$SCRIPT_DIR/Dockerfile" "$TEMP_DIR/"
cp "$SCRIPT_DIR/nginx.docker.conf" "$TEMP_DIR/"
cp "$SCRIPT_DIR/.dockerignore" "$TEMP_DIR/" 2>/dev/null || true

# If SSL enabled, update compose file with domain
if [ "$SSL_ENABLED" = true ]; then
    log "🔧 Configuring SSL for domain: $DOMAIN"
    sed -i.bak "s/your-email@example.com/admin@$DOMAIN/g" "$TEMP_DIR/docker-compose.yml"
fi

# Deploy to droplet
log "📤 Deploying to Digital Ocean droplet..."

# Check if Docker is installed on droplet
log "🔍 Checking Docker installation on droplet..."
if ! ssh root@$DROPLET_IP "command -v docker &> /dev/null"; then
    log "🐳 Installing Docker on droplet..."
    ssh root@$DROPLET_IP << 'EOF'
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
        
        # Verify Docker Compose v2 is available (comes with modern Docker)
        docker compose version
        
        # Add docker group
        usermod -aG docker root
EOF
else
    log "✅ Docker already installed"
fi

# Create deployment directory on droplet
ssh root@$DROPLET_IP "mkdir -p /opt/treasures && cd /opt/treasures"

# Copy files to droplet
log "📁 Copying files to droplet..."
rsync -avz --delete "$TEMP_DIR/" root@$DROPLET_IP:/opt/treasures/

# Copy source code for building on droplet
log "📦 Copying source code..."
cd "$PROJECT_ROOT"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.vscode' \
    --exclude '.goose*' \
    ./ root@$DROPLET_IP:/opt/treasures/src/

# Deploy on droplet
log "🚀 Starting deployment on droplet..."
ssh root@$DROPLET_IP << EOF
    cd /opt/treasures
    
    # Copy source files to build context
    cp -r src/* .
    
    # Stop existing containers
    if [ -f docker-compose.yml ]; then
        docker compose down || true
    fi
    
    # Remove old images to save space
    docker image prune -f
    
    # Build and start services
    docker compose build --no-cache
    
    if [ "$SSL_ENABLED" = true ]; then
        # Start with SSL profile
        docker compose --profile proxy --profile ssl up -d
    else
        # Start simple setup
        docker compose up -d
    fi
    
    # Wait for container to be healthy
    echo "🏥 Waiting for container to be healthy..."
    timeout 60s bash -c 'until docker ps | grep treasures-app | grep "(healthy)"; do sleep 2; done' || {
        echo "❌ Container failed to become healthy"
        docker logs treasures-app
        exit 1
    }
    
    # Show status
    docker compose ps
    
    # Clean up source files
    rm -rf src/
EOF

# Cleanup
rm -rf "$TEMP_DIR"

# Setup firewall if needed
log "🔒 Configuring firewall..."
ssh root@$DROPLET_IP << 'EOF'
    # Install and configure UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt update && apt install -y ufw
    fi
    
    # Configure firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
EOF

log "🎉 Deployment complete!"
log ""
log "📊 Container Status:"
ssh root@$DROPLET_IP "cd /opt/treasures && docker compose ps"

log ""
log "🌐 Access your app:"
if [ "$SSL_ENABLED" = true ]; then
    log "   https://$DOMAIN"
    log "   http://$DOMAIN (redirects to HTTPS)"
else
    log "   http://$DOMAIN"
fi

log ""
log "🛠️  Useful commands:"
log "   SSH to droplet: ssh root@$DROPLET_IP"
log "   View logs: ssh root@$DROPLET_IP 'cd /opt/treasures && docker compose logs -f'"
log "   Update app: ./docker/deploy-docker.sh $DROPLET_IP $DOMAIN"
log "   Stop app: ssh root@$DROPLET_IP 'cd /opt/treasures && docker compose down'"