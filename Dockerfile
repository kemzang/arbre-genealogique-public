## --- Stage 1: Build frontend with Vite ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev=false

# Copy source
COPY . .

# Build-time API URL (override at build with --build-arg)
ARG VITE_API_URL=https://example.com/api
ENV VITE_API_URL=${VITE_API_URL}

# Build React/Vite app
RUN npm run build


## --- Stage 2: Serve static files with Nginx ---
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Remove default static assets
RUN rm -rf ./*

# Copy built assets from builder
COPY --from=builder /app/dist ./

# Basic SPA config: redirect all routes to index.html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       80;
    server_name  _;

    root   /usr/share/nginx/html;
    index  index.html;

    location / {
        try_files $uri /index.html;
    }

    location /assets/ {
        try_files $uri =404;
    }

    # Basic gzip for text assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

