// ============================================================
//   EstelarBot - Handler de Movimiento Ultra-Realista
// ============================================================
import { Bot } from 'mineflayer';
import { Movements, goals } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';
import { logger } from '../utils/logger';
import { config } from '../config';

const { GoalNear, GoalBlock, GoalFollow } = goals;

// Delay aleatorio para simular comportamiento humano
function humanDelay(min = 300, max = 1200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
}

// Movimientos de idle ultra-realistas (anti-AFK)
export async function doIdleMovements(bot: Bot): Promise<void> {
  if (!bot.entity) return;

  const rand = Math.random();

  try {
    // 30% probabilidad: mirar en dirección aleatoria
    if (rand < 0.3) {
      const yaw = (Math.random() - 0.5) * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI * 0.5;
      await bot.look(yaw, pitch, false);
      await humanDelay(200, 600);
    }
    // 20% probabilidad: dar un pequeño paseo
    else if (rand < 0.5) {
      await doShortWalk(bot);
    }
    // 15% probabilidad: agacharse brevemente
    else if (rand < 0.65) {
      bot.setControlState('sneak', true);
      await humanDelay(500, 1500);
      bot.setControlState('sneak', false);
    }
    // 10% probabilidad: saltar
    else if (rand < 0.75) {
      bot.setControlState('jump', true);
      await humanDelay(100, 300);
      bot.setControlState('jump', false);
    }
    // 10% probabilidad: correr un momento
    else if (rand < 0.85) {
      bot.setControlState('sprint', true);
      bot.setControlState('forward', true);
      await humanDelay(300, 800);
      bot.setControlState('sprint', false);
      bot.setControlState('forward', false);
    }
    // 5% probabilidad: decir algo en el chat
    else if (rand < 0.90 && config.idleMessages.length > 0) {
      const msg = config.idleMessages[Math.floor(Math.random() * config.idleMessages.length)];
      await bot.chat(msg);
    }
    // Resto: no hacer nada (simula estar quieto observando)
  } catch (err) {
    // Ignorar errores en idle (pueden ocurrir si el bot está ocupado)
    logger.debug('Error en idle movement (ignorado):', err);
  }
}

// Dar una caminata corta aleatoria
async function doShortWalk(bot: Bot): Promise<void> {
  if (!bot.entity || !bot.pathfinder) return;

  const pos = bot.entity.position;
  const offsetX = (Math.random() - 0.5) * 10;
  const offsetZ = (Math.random() - 0.5) * 10;
  const target = new Vec3(
    Math.floor(pos.x + offsetX),
    Math.floor(pos.y),
    Math.floor(pos.z + offsetZ)
  );

  try {
    bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 1), true);
    await humanDelay(2000, 5000);
    bot.pathfinder.setGoal(null);
  } catch (_) {
    // Ignorar si no puede llegar
  }
}

// Seguir a un jugador de forma natural
export async function followPlayer(bot: Bot, playerName: string): Promise<void> {
  const player = bot.players[playerName]?.entity;
  if (!player) {
    logger.warn(`No se puede seguir a ${playerName}: no encontrado`);
    return;
  }
  bot.pathfinder.setGoal(new GoalFollow(player, 3), true);
}

// Moverse a una coordenada específica
export async function moveTo(bot: Bot, pos: Vec3, range = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!bot.pathfinder) return reject(new Error('Pathfinder no disponible'));
    bot.pathfinder.setGoal(new GoalNear(pos.x, pos.y, pos.z, range));
    bot.once('goal_reached', resolve);
    // Timeout de seguridad
    setTimeout(() => {
      bot.pathfinder.setGoal(null);
      resolve();
    }, 30000);
  });
}

// Escapar de una situación de peligro (nadar, escalar)
export async function escapeFromDanger(bot: Bot): Promise<void> {
  if (!bot.entity) return;

  const pos = bot.entity.position;
  const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
  const blockAtFeet = bot.blockAt(pos);

  // Detectar si está en agua o lava
  const inLiquid = blockAtFeet?.name === 'water' || blockAtFeet?.name === 'lava';
  if (inLiquid) {
    logger.warn('⚠️ Bot en líquido, activando nado de emergencia');
    bot.setControlState('jump', true);
    await humanDelay(500, 1000);
    // Intentar nadar hacia afuera
    for (let i = 0; i < 5; i++) {
      bot.setControlState('forward', true);
      bot.setControlState('jump', true);
      await humanDelay(400, 600);
    }
    bot.setControlState('forward', false);
    bot.setControlState('jump', false);
  }

  // Intentar ir a un punto seguro
  const safeOffset = [
    new Vec3(5, 0, 0),
    new Vec3(-5, 0, 0),
    new Vec3(0, 0, 5),
    new Vec3(0, 0, -5),
    new Vec3(5, 1, 5),
  ];

  for (const offset of safeOffset) {
    const safePos = pos.plus(offset);
    const block = bot.blockAt(safePos);
    if (block && block.name === 'air') {
      await moveTo(bot, safePos, 2).catch(() => {});
      return;
    }
  }
}

// Configurar los Movements de pathfinder con parámetros realistas
export function setupMovements(bot: Bot): Movements {
  const movements = new Movements(bot);
  movements.allowSprinting = true;
  movements.allowParkour = true;
  movements.canDig = false; // No excavar por defecto
  movements.scaffoldingBlocks = []; // No usar bloques de puente por defecto
  movements.maxDropDown = 4; // Máximo 4 bloques de caída
  return movements;
}
