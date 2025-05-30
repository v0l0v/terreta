# Multi-stage build for optimized container
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy built files from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY docker/nginx.docker.conf /etc/nginx/conf.d/default.conf

# Create non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set proper permissions
RUN chown -R 1001:1001 /usr/share/nginx/html && \
    chown -R 1001:1001 /var/cache/nginx && \
    chown -R 1001:1001 /var/log/nginx && \
    chown -R 1001:1001 /etc/nginx/conf.d

# Switch to non-root user
USER 1001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]