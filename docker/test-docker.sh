#!/bin/bash

# Local Docker testing script
# Usage: ./docker/test-docker.sh [options]

set -e

# Get the project root directory (parent of docker folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME="treasures-app"
CONTAINER_NAME="treasures-local"
PORT=${PORT:-8080}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Parse options
REBUILD=false
STOP_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        --stop)
            STOP_ONLY=true
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Run from project root: ./docker/test-docker.sh"
            echo ""
            echo "Options:"
            echo "  --rebuild    Force rebuild of Docker image"
            echo "  --stop       Stop and remove container only"
            echo "  --port PORT  Use custom port (default: 8080)"
            echo "  --help       Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                # Start container on port 8080"
            echo "  $0 --port 3000   # Start container on port 3000"
            echo "  $0 --rebuild     # Rebuild image and start"
            echo "  $0 --stop        # Stop running container"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "🐳 Treasures Local Docker Testing"

# Stop existing container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    log "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
fi

# Remove existing container
if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
    log "🗑️  Removing existing container..."
    docker rm $CONTAINER_NAME >/dev/null 2>&1 || true
fi

if [ "$STOP_ONLY" = true ]; then
    log "✅ Container stopped and removed"
    exit 0
fi

# Build image if it doesn't exist or if rebuild requested
if [ "$REBUILD" = true ] || ! docker images -q $IMAGE_NAME | grep -q .; then
    log "📦 Building Docker image..."
    cd "$PROJECT_ROOT"
    docker build -t $IMAGE_NAME -f docker/Dockerfile . --progress=plain
    log "✅ Image built successfully"
fi

# Run container
log "🚀 Starting container on port $PORT..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:80 \
    --restart unless-stopped \
    $IMAGE_NAME

# Wait for container to be healthy
log "🏥 Waiting for container to be healthy..."
timeout 30s bash -c "until docker ps | grep $CONTAINER_NAME | grep -q '(healthy)'; do sleep 2; done" || {
    warn "Container didn't become healthy in 30s, but it might still be starting..."
}

# Show container status
log "📊 Container status:"
docker ps -f name=$CONTAINER_NAME

log ""
log "✅ Treasures is now running locally!"
log "🌐 Open your browser to: http://localhost:$PORT"
log ""
log "🛠️  Useful commands:"
log "   View logs: docker logs -f $CONTAINER_NAME"
log "   Stop: ./docker/test-docker.sh --stop"
log "   Restart: docker restart $CONTAINER_NAME"
log "   Shell access: docker exec -it $CONTAINER_NAME sh"