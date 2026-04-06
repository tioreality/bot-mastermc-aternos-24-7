// ============================================================
//   EstelarBot - Entrada principal
//   Bot de Minecraft 24/7 ultra-realista para Estelar
//   Servidor: estelar_oficial.aternos.me (PaperMC 1.21.x)
// ============================================================

import mineflayer, { Bot, BotOptions } from 'mineflayer';
import { pathfinder, Movements } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as autoEat } from 'mineflayer-auto-eat';
import { plugin as armorManager } from 'mineflayer-armor-manager';

import { config } from './config';
import { logger } from './utils/logger';
import { discord } from './utils/discord';
import { setupAuthHandler, resetAuth } from './handlers/authHandler';
import { setupChatHandler } from './handlers/chatHandler';
import { setupCombatHandler } from './handlers/combatHandler';
import { setupMovements } from './handlers/movementHandler';
import { startBrain, stopBrain } from './plugins/brainAI';
import { setState, BotState } from './plugins/stateManager';
import { BotOptions as MFBotOptions } from 'mineflayer';

// ============================================================
//   Variables de reconexión
// ============================================================
let reconnectDelay = config.reconnectDelay;
let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let bot: Bot | null = null;

// ============================================================
//   Crear y configurar el bot
// ============================================================
function createBot(): void {
  if (isConnecting) return;
  isConnecting = true;

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🌟 EstelarBot v2.0 - Iniciando...');
  logger.info(`📡 Conectando a: ${config.host}:${config.port}`);
  logger.info(`👤 Usuario: ${config.username}`);
  logger.info(`🎮 Versión: ${config.version}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const botOptions: BotOptions = {
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: 'offline', // Servidor con LoginSecurity offline
    checkTimeoutInterval: 60000,
    hideErrors: false,
  };

  bot = mineflayer.createBot(botOptions);

  // ── Cargar plugins de Mineflayer ──────────────────────────
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(autoEat);
  bot.loadPlugin(armorManager);

  // ── Eventos del bot ───────────────────────────────────────

  bot.once('login', () => {
    logger.info('✅ Conectado al servidor');
    isConnecting = false;
    reconnectDelay = config.reconnectDelay; // Reset delay

    // Configurar pathfinder
    const movements = setupMovements(bot!);
    bot!.pathfinder.setMovements(movements);

    // Configurar auto-eat
    (bot as any).autoEat.options = {
      priority: 'foodPoints',
      startAt: config.eatFoodLevel,
      bannedFood: ['rotten_flesh', 'spider_eye', 'poisonous_potato', 'pufferfish', 'chicken'],
    };

    // Configurar armor manager (equipa automáticamente la mejor armadura)
    // El plugin mineflayer-armor-manager se activa automáticamente

    // Inicializar handlers
    resetAuth();
    setupAuthHandler(bot!);
    setupChatHandler(bot!);
    setupCombatHandler(bot!);

    setState(BotState.IDLE);
    logger.info('🚀 Todos los sistemas inicializados. EstelarBot operativo.');
  });

  bot.once('spawn', async () => {
    logger.info('👾 Bot apareció en el mundo');
    discord.botOnline().catch(() => {});

    // Esperar 2 segundos antes de iniciar la IA (dar tiempo a la autenticación)
    setTimeout(() => {
      startBrain(bot!);
      logger.info('🧠 Sistema de IA activado');
    }, 3000);
  });

  bot.on('health', () => {
    const hp = bot?.health ?? 0;
    const food = bot?.food ?? 0;
    if (config.debug) {
      logger.debug(`❤️  HP: ${hp.toFixed(1)} | 🍖 Comida: ${food}`);
    }
  });

  // Evento cuando otro jugador entra al servidor
  bot.on('playerJoined', (player) => {
    if (player.username === bot?.username) return;
    logger.info(`👋 Jugador conectado: ${player.username}`);
    // Si el owner se conecta, saludar
    if (player.username === config.owner) {
      setTimeout(() => {
        bot?.chat(`⭐ ¡Hola ${config.owner}! EstelarGuard online y a tu servicio.`);
      }, 2000);
    }
  });

  bot.on('playerLeft', (player) => {
    logger.info(`👋 Jugador desconectado: ${player.username}`);
    // Si el owner se fue y estábamos siguiéndolo, volver a idle
    if (player.username === config.owner) {
      setState(BotState.IDLE);
    }
  });

  // ── Manejo de desconexión y errores ──────────────────────

  bot.on('kicked', (reason) => {
    const reasonStr = typeof reason === 'string' ? reason : JSON.stringify(reason);
    logger.warn(`⚠️ Bot expulsado del servidor: ${reasonStr}`);
    discord.botOffline(`Kicked: ${reasonStr}`).catch(() => {});
    handleDisconnect();
  });

  bot.on('end', (reason) => {
    logger.warn(`🔌 Conexión terminada: ${reason}`);
    discord.botOffline(reason || 'Conexión cerrada').catch(() => {});
    handleDisconnect();
  });

  bot.on('error', (err) => {
    logger.error(`❌ Error del bot: ${err.message}`);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      logger.warn('🔌 Servidor posiblemente offline (Aternos puede estar dormido)');
    }
  });

  // Manejo de errores no capturados
  bot.on('path_update', (r) => {
    if (r.status === 'noPath') {
      logger.debug('🗺️ Pathfinder: No se encontró camino');
    }
  });
}

// ── Reconexión con delay exponencial ─────────────────────────
function handleDisconnect(): void {
  stopBrain();
  bot = null;
  isConnecting = false;

  if (reconnectTimer) clearTimeout(reconnectTimer);

  logger.info(`⏳ Reconectando en ${(reconnectDelay / 1000).toFixed(0)}s...`);
  reconnectTimer = setTimeout(() => {
    createBot();
    // Aumentar delay exponencialmente hasta el máximo
    reconnectDelay = Math.min(reconnectDelay * 1.5, config.reconnectMaxDelay);
  }, reconnectDelay);
}

// ── Inicio ────────────────────────────────────────────────────
createBot();

// Manejo de señales de sistema para apagado limpio
process.on('SIGINT', () => {
  logger.info('🛑 Apagado manual recibido (SIGINT)');
  stopBrain();
  bot?.quit('EstelarBot apagado manualmente');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM recibido');
  stopBrain();
  bot?.quit('EstelarBot terminado');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(`💥 Error no capturado: ${err.message}`, err);
  discord.error(`Error crítico: ${err.message}`).catch(() => {});
  // No salir, intentar seguir corriendo
});

process.on('unhandledRejection', (reason) => {
  logger.warn(`⚠️ Promise rechazada sin manejar: ${reason}`);
});
