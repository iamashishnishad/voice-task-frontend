# Optimized Dockerfile with ajv fix
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install with specific versions to fix ajv issue
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Force install compatible versions
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 --save-exact

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]