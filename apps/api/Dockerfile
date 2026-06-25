# Stage 1: Build & Dependencies
# Node >= 23.4 expõe `node:sqlite` sem flag; usamos Node 26 para casar com o bare-metal.
FROM node:26-alpine AS builder

RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @arateki/api build

# Stage 2: Runtime
FROM node:26-alpine

RUN npm install -g pnpm
WORKDIR /app

# Copy built API and runtime dependencies from the builder stage.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# SQLite embutido (node:sqlite) — sem módulo nativo, sem toolchain.
# O banco vive em /data, montado como volume nomeado pelo compose.
ENV SQLITE_PATH=/data/arateki.db
RUN mkdir -p /data

EXPOSE 3333
CMD ["node", "apps/api/dist/main.js"]
