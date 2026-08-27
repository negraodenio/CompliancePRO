# Multi-stage lightweight build for ComplyPRO Standalone
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
RUN npm ci

COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build Web SPA bundle and compile TS server
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

EXPOSE 3000

# Run lightweight REST API and MCP Daemon
CMD ["node", "--loader", "ts-node/esm", "src/server/app.ts"]
