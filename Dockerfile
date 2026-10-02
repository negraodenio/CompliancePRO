# ==============================================================================
# COMPLYPRO.PT — PRODUCTION HARDENED MULTI-STAGE DOCKERFILE
# "Build with your framework. Govern with ComplyPRO."
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Typecheck (Builder)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
RUN npm ci

# Copy source code and UI assets
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Validate TypeScript typecheck and compile Vite SPA bundle
RUN npx tsc --noEmit && npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime (Runner)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only (including tsx for running server app)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built web application and compiled backend server bundle
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Set proper non-root file ownership
RUN chown -R node:node /app

# Expose standard port
EXPOSE 3000

# Container liveness healthcheck via native alpine wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Security: Run as unprivileged non-root user
USER node

# Execute ComplyPRO compiled production server (pure JS, zero JIT dev dependencies)
CMD ["node", "dist-server/app.js"]
