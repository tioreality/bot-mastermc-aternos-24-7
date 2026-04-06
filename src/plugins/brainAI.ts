// ============================================================
//   EstelarBot - Sistema de IA de Comportamiento (El "Cerebro")
// ============================================================
import { Bot } from 'mineflayer';
import { logger } from '../utils/logger';
import { config } from '../config';
import { BotState, getCurrentState, setState } from './stateManager';
import { doIdleMovements, followPlayer } from '../handlers/movementHandler';
import { startFarming, stopFarming } from './farmingPlugin';
import { startMining, stopMining } from './miningPlugin';
import { getAuthStatus } from '../handlers/authHandler';

let brainInterval: NodeJS.Timeout | null = null;
let idleMovementInterval: NodeJS.Timeout | null = null;
let lastDecisionTime = 0;
const DECISION_INTERVAL_MIN = 5000;
const DECISION_INTERVAL_MAX = 15000;

// Iniciar el cerebro del bot
export function startBrain(bot: Bot): void {
  logger.info('🧠 Iniciando sistema de IA...');

  // Toma de decisiones inteligente cada 5-15 segundos
  schedulNextDecision(bot);

  // Movimientos de idle cada 8-20 segundos
  idleMovementInterval = setInterval(async () => {
    if (!getAuthStatus()) return;
    if (getCurrentState() === BotState.IDLE) {
      await doIdleMovements(bot).catch(() => {});
    }
  }, 8000 + Math.random() * 12000);

  // Loop de seguimiento del owner (cuando está en modo FOLLOWING)
  setInterval(() => {
    if (getCurrentState() === BotState.FOLLOWING && config.owner) {
      followPlayer(bot, config.owner).catch(() => {});
    }
  }, 1000);

  // Monitor de supervivencia: cada 2 segundos
  setInterval(() => {
    if (!getAuthStatus()) return;
    survivalCheck(bot);
  }, 2000);
}

// Detener el cerebro
export function stopBrain(): void {
  if (brainInterval) { clearTimeout(brainInterval); brainInterval = null; }
  if (idleMovementInterval) { clearInterval(idleMovementInterval); idleMovementInterval = null; }
  stopFarming();
  stopMining();
  logger.info('🧠 Sistema de IA detenido');
}

// Programar la próxima decisión en un tiempo aleatorio
function schedulNextDecision(bot: Bot): void {
  const delay = DECISION_INTERVAL_MIN + Math.random() * (DECISION_INTERVAL_MAX - DECISION_INTERVAL_MIN);
  brainInterval = setTimeout(async () => {
    await makeBrainDecision(bot).catch(err => logger.debug('Error en decisión IA:', err));
    schedulNextDecision(bot); // Programar la siguiente
  }, delay);
}

// Tomar una decisión inteligente según el contexto
async function makeBrainDecision(bot: Bot): Promise<void> {
  if (!getAuthStatus()) return;

  const state = getCurrentState();
  const hp = bot.health;
  const food = bot.food;
  const pos = bot.entity?.position;

  // No interrumpir si estamos en combate o huyendo
  if (state === BotState.FLEEING || state === BotState.COMBAT) return;

  // Lógica de decisiones por prioridad
  // 1. Si la salud es baja, buscar comida
  if (hp < 10 && food < 14) {
    logger.info('🧠 Decisión: Buscar comida (salud baja)');
    await forceEat(bot);
    return;
  }

  // 2. Si el inventario está lleno, ir al home
  if (bot.inventory.items().length >= 35) {
    const { getLocation } = await import('../utils/dataManager');
    const home = getLocation('home');
    if (home) {
      logger.info('🧠 Decisión: Ir al home (inventario lleno)');
      setState(BotState.MOVING);
      const { GoalBlock } = await import('mineflayer-pathfinder').then(m => m.goals);
      bot.pathfinder?.setGoal(new GoalBlock(home.x, home.y, home.z));
    }
    return;
  }

  // 3. Si hay owner online, seguirlo (solo si no hay órdenes activas)
  if (config.owner && state === BotState.IDLE) {
    const ownerOnline = bot.players[config.owner];
    if (ownerOnline?.entity) {
      logger.info(`🧠 Decisión: Owner ${config.owner} detectado, siguiendo`);
      setState(BotState.FOLLOWING);
      return;
    }
  }

  // 4. Si está en idle mucho tiempo, elegir actividad aleatoria
  if (state === BotState.IDLE) {
    const rand = Math.random();
    if (rand < 0.35) {
      logger.info('🧠 Decisión: Iniciar farmeo automático');
      startFarming(bot);
    } else if (rand < 0.55) {
      logger.info('🧠 Decisión: Iniciar minería');
      startMining(bot);
    } else if (rand < 0.75) {
      logger.info('🧠 Decisión: Explorar alrededores');
      setState(BotState.EXPLORING);
      await exploreRandomly(bot);
    }
    // El resto del tiempo se queda idle con movimientos random
  }

  // 5. Si estaba explorando, volver a idle después de un rato
  if (state === BotState.EXPLORING) {
    setState(BotState.IDLE);
  }
}

// Chequeo de supervivencia continuo
function survivalCheck(bot: Bot): void {
  if (!bot.entity) return;

  // Auto-nadar si está en agua
  const blockAtFeet = bot.blockAt(bot.entity.position);
  if (blockAtFeet?.name === 'water') {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
  }

  // Evitar lava: si está en lava, huir INMEDIATAMENTE
  if (blockAtFeet?.name === 'lava') {
    logger.error('🔥 ¡LAVA DETECTADA! Huyendo...');
    setState(BotState.FLEEING);
    bot.setControlState('jump', true);
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('jump', false);
      bot.setControlState('forward', false);
    }, 2000);
  }
}

// Forzar comer el primer alimento disponible
async function forceEat(bot: Bot): Promise<void> {
  const foodItems = bot.inventory.items().filter(item => {
    // Comprobar si el item es comestible
    return bot.registry.itemsByName[item.name]?.food !== undefined;
  });

  if (foodItems.length === 0) return;

  const bestFood = foodItems.reduce((a, b) => {
    const aFood = (bot.registry.itemsByName[a.name] as any)?.food?.foodPoints ?? 0;
    const bFood = (bot.registry.itemsByName[b.name] as any)?.food?.foodPoints ?? 0;
    return aFood > bFood ? a : b;
  });

  try {
    await bot.equip(bestFood, 'hand');
    await bot.consume();
  } catch (err) {
    logger.debug('Error comiendo:', err);
  }
}

// Exploración aleatoria
async function exploreRandomly(bot: Bot): Promise<void> {
  if (!bot.entity || !bot.pathfinder) return;
  const pos = bot.entity.position;
  const { GoalNear } = await import('mineflayer-pathfinder').then(m => m.goals);

  const dx = (Math.random() - 0.5) * 60;
  const dz = (Math.random() - 0.5) * 60;

  bot.pathfinder.setGoal(
    new GoalNear(Math.floor(pos.x + dx), Math.floor(pos.y), Math.floor(pos.z + dz), 3),
    true
  );

  await new Promise(resolve => setTimeout(resolve, 10000));
  bot.pathfinder?.setGoal(null);
}
