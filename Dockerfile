FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.ui.json vite.config.ts ./
COPY src/ src/
COPY server.ts ./
COPY ui/ ui/

RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/dist-ui/ dist-ui/

ENV PORT=8080
ENV TUTELIQ_MCP_TRANSPORT=http

EXPOSE 8080

CMD ["node", "dist/server.js"]
