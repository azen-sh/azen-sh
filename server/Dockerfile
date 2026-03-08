FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY core/package.json ./core/
COPY server/package.json ./server/
COPY packages/types/package.json ./packages/types/

RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY packages/types ./packages/types
COPY core ./core
COPY server ./server
COPY package.json bun.lock ./

WORKDIR /app/server

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]