# Docker Deployment

Single deployment script that ensures true zero-downtime deployment.

## 🚀 Quick Start

```bash
# Set your droplet IP
export DROPLET_IP=137.184.52.198

# Deploy (automatically uses zero-downtime if site is running)
./docker/deploy.sh $DROPLET_IP

# Or use npm script
npm run deploy:docker
```

## 📜 Usage

### Basic Deployment
```bash
./docker/deploy.sh 137.184.52.198
```

### Force Fresh Deployment
```bash
./docker/deploy.sh 137.184.52.198 --force-fresh
```

### Debug Mode
```bash
./docker/deploy.sh 137.184.52.198 --debug
```

## 🧠 Intelligent Deployment

The script automatically chooses the best deployment strategy:

- **🔄 Zero-downtime deployment** if site is currently running
- **🆕 Fresh deployment** if site is down or `--force-fresh` is used
- **🛡️ Automatic rollback** if anything fails
- **🏥 Health checks** ensure new container works before switching

## 🔄 True Zero-Downtime Process

The deployment process ensures zero-downtime by completely staging the new version before switching traffic:

1. **Build locally** - Ensures source is ready and catches errors early
2. **Sync files** - Uploads latest code to server  
3. **Build new image** - Creates fresh image with unique tag (parallel to production)
4. **Start staging container** - On isolated network with exposed port 8081
5. **Health check staging** - Waits up to 3 minutes for container to be healthy
6. **Test staging directly** - Validates new version works via port 8081
7. **Connect to production network** - Adds staging container to production network
8. **Test via production network** - Validates internal network connectivity
9. **Atomic traffic switch** - Instant Caddy config update (only potential disruption moment)
10. **Verify switch success** - Tests through full production request chain
11. **Auto-rollback or cleanup** - Removes old container only after success

### Key Zero-Downtime Features

- **🏗️ Parallel building** - New image built while production runs
- **🌐 Network isolation** - Staging tested completely separate from production
- **⚡ Atomic switch** - Traffic switch happens in milliseconds via Caddy reload
- **🛡️ Instant rollback** - Any failure triggers immediate rollback to working version
- **✅ Full verification** - Every step tested before proceeding

### Monitoring Deployment

Watch your site during deployment to verify zero-downtime:

```bash
# In a separate terminal, monitor site availability
./docker/monitor-deployment.sh https://treasures.to

# Then run deployment in another terminal
./docker/deploy.sh 137.184.52.198
```

The monitor will show real-time availability and track any downtime (there should be none!).

## 🛠️ NPM Scripts

```bash
# Set environment variable
export DROPLET_IP=137.184.52.198

# Available commands
npm run deploy:docker        # Smart deployment
npm run deploy:docker:fresh  # Force fresh rebuild
npm run deploy:docker:debug  # Verbose logging
```

## 🚨 Troubleshooting

### Deployment fails during staging
If the new container fails health checks or testing, the old container keeps running untouched.

### Traffic switch fails
If the Caddy configuration update fails, immediate automatic rollback occurs.

### Site goes down anyway
This shouldn't happen with the new process, but if it does:
```bash
# Check if containers are running
ssh root@137.184.52.198 'cd /opt/treasures && docker compose ps'

# Check Caddy status
ssh root@137.184.52.198 'cd /opt/treasures && docker logs caddy --tail 20'

# Force fresh deployment
./docker/deploy.sh 137.184.52.198 --force-fresh
```

### Check deployment status
```bash
ssh root@137.184.52.198 'cd /opt/treasures && docker compose ps && docker compose logs --tail 10'
```

### Quick health check
```bash
curl -I https://treasures.to/
curl -I https://treasures.to/og-image.png
```

## 🏗️ Architecture

- **App Container**: Serves static files using `serve` package
- **Caddy Container**: Reverse proxy with automatic SSL and hot-reload config
- **Staging Process**: Isolated network testing before production switch
- **Health Checks**: Built-in container health monitoring with retries