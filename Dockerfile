# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# ✅ Etapa crítica: copiar package.json antes
COPY package*.json ./

# Agora sim: instalar dependências
RUN npm install

# Agora copiar o restante do código-fonte
COPY . .

# Builda Vite (e opcionalmente transpila server)
RUN npm run build

# Etapa 2: runtime
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./

RUN chown -R nextjs:nodejs /app
USER nextjs

ENV PORT=3000
EXPOSE $PORT

# CMD ["node", "dist/server/index.js"]
CMD ["node", "dist/index.js"]
    