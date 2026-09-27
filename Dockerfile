FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package.json and lock file
COPY package.json package-lock.json ./

# Copy workspace package.jsons so npm can resolve the workspace tree
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy the actual source code for the backend and types
COPY apps/api ./apps/api
COPY packages/types ./packages/types

# Build the API
RUN npm run build --workspace=@qr-menu/api

# --- Runner Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy built API
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy shared types
COPY --from=builder /app/packages/types ./packages/types

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=@qr-menu/api"]
