# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependencias incluindo devDependencies para o build do Vite e esbuild
COPY package.json package-lock.json* ./
RUN npm install

# Copia codigo-fonte
COPY . .

# Compila o frontend React (Vite) e empacota o backend (server.ts -> dist/server.js)
RUN npm run build

# Stage 2: Runtime para Cloud Run
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instala apenas dependencias de producao
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copia artefatos compilados
COPY --from=build /app/dist ./dist

# Copia dados persistentes, ficheiros publicos e configuracao do Firebase
COPY --from=build /app/data ./data
COPY --from=build /app/public ./public
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json

EXPOSE 3000

# Verificacao de integridade para o Cloud Run
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# O Cloud Run passa PORT dinamicamente (normalmente 8080 ou 3000) e server.ts escuta em 0.0.0.0
CMD ["node", "dist/server.js"]
