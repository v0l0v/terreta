#!/bin/bash

# Simple deploy script with Caddy SSL
# Usage: ./deploy.sh DROPLET_IP

DROPLET_IP=$1

if [ -z "$DROPLET_IP" ]; then
    echo "Usage: $0 <droplet-ip>"
    echo "Example: $0 192.168.1.100"
    exit 1
fi

echo "🚀 Deploying treasures.to with SSL to $DROPLET_IP"

# Copy files and deploy
rsync -avz --exclude 'node_modules' --exclude '.git' ../  root@$DROPLET_IP:/opt/treasures/
scp docker-compose.yml root@$DROPLET_IP:/opt/treasures/
scp Caddyfile root@$DROPLET_IP:/opt/treasures/
scp Dockerfile root@$DROPLET_IP:/opt/treasures/

# Deploy on droplet
ssh root@$DROPLET_IP << 'EOF'
    cd /opt/treasures
    
    # Stop everything clean
    docker compose down || true
    
    # Build and start
    docker compose build
    docker compose up -d
    
    # Check status
    sleep 10
    docker compose ps
    
    # Check if ports are bound
    echo ""
    echo "Port status:"
    netstat -tlnp | grep -E ":80|:443" || echo "Ports not yet bound"
    
    # Quick Caddy status
    echo ""
    echo "Caddy logs (last 5 lines):"
    docker logs caddy --tail 5 2>/dev/null || echo "Caddy not running yet"
EOF

echo ""
echo "✅ Deployed!"
echo "🌐 HTTP:  http://treasures.to (redirects to HTTPS)"  
echo "🔒 HTTPS: https://treasures.to"
echo ""
echo "Caddy will automatically get SSL certificates from Let's Encrypt"
echo "Monitor: ssh root@$DROPLET_IP 'docker logs -f caddy'"