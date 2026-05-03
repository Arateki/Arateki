# Stage 1: Build & Output
# Using a single stage for web as per your Pokedex pattern
FROM node:22-alpine

RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @arateki/web build

# Following your Pokedex pattern:
# The container builds and then copies to the /output volume
CMD cp -r /app/apps/web/dist/* /output/ && chown -R 1000:1000 /output
