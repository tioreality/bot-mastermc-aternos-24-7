# ============================================================
#   EstelarBot - Dockerfile
#   Bot de Minecraft 24/7 para servidor Estelar
# ============================================================

FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias de sistema
RUN apk add --no-cache python3 make g++

# Copiar package.json primero (para cache de capas)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente ya compilado
COPY dist/ ./dist/
COPY data/ ./data/

# Variables de entorno (se sobreescriben en docker-compose)
ENV NODE_ENV=production

# Directorio de logs
RUN mkdir -p /app/logs

# Comando de inicio
CMD ["node", "dist/index.js"]
