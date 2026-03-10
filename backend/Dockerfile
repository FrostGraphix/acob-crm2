# ============================================================
# Backend Dockerfile — Node.js production build
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy shared types first
COPY common/ ./common/

# Install & build backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production=false
COPY backend/ ./backend/
RUN cd backend && npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/common/ ./common/
COPY --from=build /app/backend/package*.json ./backend/
RUN cd backend && npm ci --production

COPY --from=build /app/backend/dist/ ./backend/dist/

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "backend/dist/index.js"]
