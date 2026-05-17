FROM node:22-alpine

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy packages and api source
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install all deps (devDeps needed for nest build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @fredys/api exec prisma generate

# Compile TypeScript
RUN pnpm --filter @fredys/api build

# Verify dist was created (fails build if missing)
RUN ls apps/api/dist/main.js

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
