# Stage de build
FROM node:18-alpine AS build
WORKDIR /app

# Copia package files e instala dependências (inclui dev deps para build)
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Copia o restante do código
COPY . .

# Build do frontend (vite) e transpila o backend TS -> dist/
RUN npm run build || true
RUN npx tsc --project tsconfig.json --outDir dist

# Stage de runtime
FROM node:18-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Copia apenas os artefatos necessários
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Instala apenas dependências de produção
RUN npm install --production

EXPOSE 3000

# Use a porta que o Cloud Run passa via PORT env (server.ts usa process.env.PORT)
CMD ["node", "dist/server.js"]
