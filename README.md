# 🌟 EstelarBot v2.0

> Bot de Minecraft 24/7 ultra-realista para el servidor **Estelar** (PaperMC 1.21.x)  
> Construido con Node.js + TypeScript + Mineflayer

---

## ✨ Características principales

| Función | Descripción |
|---|---|
| 🔐 **Auto-autenticación** | Login/registro automático con LoginSecurity |
| 🧠 **IA de comportamiento** | Toma decisiones inteligentes cada 5-15 segundos |
| 🌾 **Auto-farmeo** | Trigo, zanahorias, patatas, caña de azúcar y más |
| ⛏️ **Auto-minería** | Busca minerales prioritarios (diamantes primero) |
| ⚔️ **Auto-combate** | Ataca mobs hostiles, huye cuando la salud es baja |
| 🍖 **Auto-comida** | Come automáticamente cuando tiene hambre |
| 🛡️ **Auto-armadura** | Equipa la mejor armadura disponible |
| 🚶 **Anti-AFK realista** | Movimientos, saltos, agacharse, mirar alrededor |
| 🔄 **Reconexión automática** | Con delay exponencial + re-autenticación |
| 💬 **Comandos de owner** | Control total por chat en el juego |
| 📊 **Logs detallados** | Sistema Winston con rotación de archivos |
| 🔔 **Discord Webhook** | Notificaciones opcionales a Discord |
| 💾 **Ubicaciones guardadas** | Home, granja, mina en JSON persistente |
| 👻 **Modo sigiloso** | Evita a otros jugadores cuando se activa |

---

## 📁 Estructura del proyecto

```
estelarbot/
├── src/
│   ├── index.ts                 # Entrada principal
│   ├── config.ts                # Configuración central
│   ├── handlers/
│   │   ├── authHandler.ts       # Login/registro automático
│   │   ├── chatHandler.ts       # Comandos del owner
│   │   ├── combatHandler.ts     # Combate y supervivencia
│   │   └── movementHandler.ts   # Movimientos realistas
│   ├── plugins/
│   │   ├── brainAI.ts           # Sistema de IA (el "cerebro")
│   │   ├── farmingPlugin.ts     # Farmeo automático
│   │   ├── miningPlugin.ts      # Minería automática
│   │   └── stateManager.ts      # Gestor de estados
│   └── utils/
│       ├── logger.ts            # Sistema de logs (Winston)
│       ├── dataManager.ts       # Datos persistentes (JSON)
│       └── discord.ts           # Notificaciones Discord
├── data/
│   └── locations.json           # Coordenadas guardadas
├── logs/                        # Logs automáticos (rotación diaria)
├── dist/                        # Código compilado (generado)
├── .env.example                 # Plantilla de variables de entorno
├── .env                         # Tu configuración (NO subir a git)
├── package.json
├── tsconfig.json
├── ecosystem.config.js          # Configuración PM2
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Instalación rápida

### Requisitos previos
- **Node.js** v18 o superior ([descargar](https://nodejs.org))
- **npm** v9 o superior (viene con Node.js)
- **Git** (opcional)

### Paso 1 – Clonar o descargar el proyecto

```bash
git clone https://github.com/tu-usuario/estelarbot.git
cd estelarbot
```

### Paso 2 – Instalar dependencias

```bash
npm install
```

### Paso 3 – Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```env
MC_HOST=estelar_oficial.aternos.me
MC_PORT=52863
MC_VERSION=1.21.1
BOT_USERNAME=EstelarGuard
BOT_PASSWORD=TuContraseñaSegura123
OWNER_USERNAME=TuNickDeMinecraft
```

### Paso 4 – Compilar TypeScript

```bash
npm run build
```

### Paso 5 – Ejecutar

```bash
# Modo desarrollo (sin compilar)
npm run dev

# Modo producción (compilado)
npm start
```

---

## 💬 Comandos del Owner

Escribe estos comandos **en el chat de Minecraft** (el owner definido en `.env`):

| Comando | Descripción |
|---|---|
| `/bot help` | Ver todos los comandos |
| `/bot follow` | El bot te sigue |
| `/bot stop` | Detener todas las acciones |
| `/bot status` | Ver HP, comida y posición |
| `/bot mine` | Iniciar minería automática |
| `/bot farm` | Iniciar farmeo automático |
| `/bot guard` | Modo guardia (ataca mobs) |
| `/bot come` | Venir a tu posición |
| `/bot home` | Ir al home guardado |
| `/bot sethome` | Guardar posición actual como home |
| `/bot setfarm` | Guardar posición de granja |
| `/bot setmine` | Guardar posición de mina |
| `/bot coords` | Ver coordenadas actuales |
| `/bot inv` | Resumen del inventario |
| `/bot stealth` | Activar/desactivar modo sigiloso |
| `/bot say <mensaje>` | Decir algo en el chat |

---

## ☁️ Ejecutar 24/7 en servidor/VPS

### Opción A – PM2 (recomendado para VPS)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Compilar primero
npm run build

# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver logs en tiempo real
pm2 logs EstelarBot

# Guardar para que arranque al reiniciar el VPS
pm2 save
pm2 startup
```

### Opción B – Docker

```bash
# Compilar imagen
npm run build
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opción C – Railway.app (gratis, sin VPS)

1. Sube el proyecto a GitHub
2. Ve a [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Añade las variables de entorno en el panel de Railway
4. Railway detectará automáticamente el `Dockerfile` y lo desplegará

### Opción D – Oracle Cloud Free Tier (gratis permanente)

1. Crea una cuenta en [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Crea una VM (Ubuntu 22.04, AMD, Always Free)
3. Conecta por SSH y ejecuta:

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Clonar y configurar el bot
git clone https://github.com/tu-usuario/estelarbot.git
cd estelarbot
npm install
cp .env.example .env
nano .env  # Edita tu configuración
npm run build

# Iniciar con PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

---

## ⚙️ Variables de entorno completas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MC_HOST` | IP del servidor | `estelar_oficial.aternos.me` |
| `MC_PORT` | Puerto del servidor | `52863` |
| `MC_VERSION` | Versión de Minecraft | `1.21.1` |
| `BOT_USERNAME` | Nick del bot | `EstelarGuard` |
| `BOT_PASSWORD` | Contraseña de LoginSecurity | `MiPassword123` |
| `OWNER_USERNAME` | Nick del owner (tú) | `TuNick` |
| `RECONNECT_DELAY_MS` | Delay inicial de reconexión (ms) | `10000` |
| `RECONNECT_MAX_DELAY_MS` | Delay máximo de reconexión (ms) | `120000` |
| `DISCORD_WEBHOOK_URL` | Webhook de Discord (opcional) | `https://discord.com/api/webhooks/...` |
| `EAT_FOOD_LEVEL` | Nivel de hambre para comer (0-20) | `14` |
| `MAX_PATHFIND_DISTANCE` | Distancia máxima de pathfinding | `150` |
| `STEALTH_MODE` | Modo sigiloso al iniciar | `false` |
| `DEBUG_MODE` | Logs de debug | `false` |

---

## 🔔 Notificaciones a Discord (opcional)

1. En tu servidor de Discord → Configuración del canal → Integraciones → Webhooks → Crear Webhook
2. Copia la URL del webhook
3. Pégala en `.env` como `DISCORD_WEBHOOK_URL`

El bot enviará notificaciones cuando:
- Se conecta al servidor ✅
- Se desconecta ⚠️
- Muere 💀
- El owner ejecuta un comando 👑
- Hay un error crítico ❌

---

## 🛠️ Plugins de Mineflayer utilizados

| Plugin | Versión | Función |
|---|---|---|
| `mineflayer` | ^4.23.0 | Base del bot |
| `mineflayer-pathfinder` | ^2.4.5 | Navegación inteligente + parkour |
| `mineflayer-pvp` | ^1.3.2 | Combate automático |
| `mineflayer-auto-eat` | ^6.0.1 | Comer automáticamente |
| `mineflayer-armor-manager` | ^2.0.1 | Equipar mejor armadura |
| `mineflayer-collect-block` | ^1.4.1 | Recoger items del suelo |

---

## ❓ Preguntas frecuentes

**¿El bot funciona con Aternos?**  
Sí. Aternos pone el servidor en standby cuando no hay jugadores. El bot tiene reconexión automática con delay exponencial para manejar esto.

**¿El bot puede ser baneado?**  
Usa movimientos y tiempos aleatorios para parecer humano, pero ningún bot es 100% indetectable. Úsalo con responsabilidad.

**¿Qué pasa si Aternos cambia el puerto?**  
Actualiza `MC_PORT` en tu `.env` y reinicia el bot.

**¿Por qué el bot no se autentica?**  
Verifica que `BOT_PASSWORD` en `.env` coincide exactamente con la contraseña registrada en el servidor con LoginSecurity.

---

## 📜 Licencia

MIT © 2024 EstelarBot
