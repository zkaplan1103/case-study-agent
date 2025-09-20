# Multi-stage build for frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL (can be overridden at build time)
ARG REACT_APP_API_URL=http://localhost:3001

# Set environment variable for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runtime

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S frontend -u 1001 -G nginx-app

# Ensure nginx can access the files
RUN chown -R frontend:nginx-app /usr/share/nginx/html && \
    chown -R frontend:nginx-app /var/cache/nginx && \
    chown -R frontend:nginx-app /var/log/nginx && \
    chown -R frontend:nginx-app /etc/nginx/conf.d

# Switch to non-root user
USER frontend

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]