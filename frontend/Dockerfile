# ============================================================
# Frontend Dockerfile — Vite build + nginx
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy shared types
COPY common/ ./common/

# Install & build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ── Production stage — nginx ─────────────────────────────────
FROM nginx:1.25-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
