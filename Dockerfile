# ============================================================
#   EstelarBot - Dockerfile CORREGIDO para Railway
#   Compila TypeScript DENTRO del contenedor (no necesita dist/)
# ============================================================

FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar git (necesario para algunas dependencias de npm)
RUN apk add --no-cache git

# Copiar archivos de configuración primero (mejor cache de capas)
COPY package*.json ./
COPY tsconfig.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm install

# Copiar código fuente TypeScript
COPY src/ ./src/
COPY data/ ./data/

# Compilar TypeScript → JavaScript
RUN npm run build

# Eliminar devDependencies para reducir tamaño de imagen
RUN npm prune --production

# Crear directorio de logs
RUN mkdir -p /app/logs

# Variable de entorno de producción
ENV NODE_ENV=production

# Comando de inicio con el JS compilado
CMD ["node", "dist/index.js"]
