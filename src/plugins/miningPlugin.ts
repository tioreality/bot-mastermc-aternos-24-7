// ============================================================
//   EstelarBot - Plugin de Minería Automática
// ============================================================
import { Bot } from 'mineflayer';
import { logger } from '../utils/logger';
import { config } from '../config';
import { BotState, getCurrentState, setState } from './stateManager';

let miningActive = false;
let miningInterval: NodeJS.Timeout | null = null;

// Iniciar minería automática
export function startMining(bot: Bot): void {
  if (miningActive) return;
  miningActive = true;
  setState(BotState.MINING);
  logger.info('⛏️ Iniciando minería automática...');
  miningInterval = setInterval(() => miningTick(bot), 3000);
}

// Detener minería
export function stopMining(): void {
  miningActive = false;
  if (miningInterval) {
    clearInterval(miningInterval);
    miningInterval = null;
  }
  logger.info('⛏️ Minería detenida');
}

// Un ciclo de minería
async function miningTick(bot: Bot): Promise<void> {
  if (!miningActive || getCurrentState() !== BotState.MINING) return;
  if (!bot.entity) return;

  // Verificar que el inventario no esté lleno
  if (bot.inventory.items().length >= 35) {
    logger.info('🎒 Inventario casi lleno, pausando minería');
    return;
  }

  try {
    // Buscar mineral prioritario más cercano
    const oreBlock = findNearestOre(bot);
    if (!oreBlock) {
      logger.debug('No se encontraron minerales cercanos, explorando...');
      await exploreForOres(bot);
      return;
    }

    logger.info(`💎 Mineral encontrado: ${oreBlock.name} en (${oreBlock.position.x}, ${oreBlock.position.y}, ${oreBlock.position.z})`);

    // Equipar la mejor piqueta disponible
    await equipBestPickaxe(bot);

    // Ir al mineral
    const { GoalBlock } = await import('mineflayer-pathfinder').then(m => m.goals);
    bot.pathfinder.setGoal(new GoalBlock(oreBlock.position.x, oreBlock.position.y, oreBlock.position.z));
    await waitUntilGoalReached(bot, 15000);

    // Minar el bloque
    if (bot.canDigBlock(oreBlock)) {
      await bot.dig(oreBlock);
      logger.info(`⛏️ ¡Minado: ${oreBlock.name}!`);
    }

    // Recoger el item
    await delay(500);

  } catch (err) {
    logger.debug('Error en miningTick:', err);
  }
}

// Encontrar el mineral más prioritario y cercano
function findNearestOre(bot: Bot): any {
  for (const oreName of config.priorityOres) {
    const oreId = bot.registry.blocksByName[oreName]?.id;
    if (!oreId) continue;

    const block = bot.findBlock({
      matching: oreId,
      maxDistance: 32,
    });

    if (block) return block;
  }
  return null;
}

// Equipar la mejor piqueta del inventario
async function equipBestPickaxe(bot: Bot): Promise<void> {
  const pickaxeOrder = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe', 'golden_pickaxe'];

  for (const pickaxeName of pickaxeOrder) {
    const item = bot.inventory.items().find(i => i.name === pickaxeName);
    if (item) {
      try {
        await bot.equip(item, 'hand');
        return;
      } catch (_) {}
    }
  }
}

// Explorar buscando minerales (moverse aleatoriamente)
async function exploreForOres(bot: Bot): Promise<void> {
  if (!bot.entity) return;
  const pos = bot.entity.position;
  const { GoalNear } = await import('mineflayer-pathfinder').then(m => m.goals);

  const dx = (Math.random() - 0.5) * 30;
  const dz = (Math.random() - 0.5) * 30;
  const dy = (Math.random() - 0.5) * 10;

  bot.pathfinder.setGoal(
    new GoalNear(
      Math.floor(pos.x + dx),
      Math.max(5, Math.floor(pos.y + dy)),
      Math.floor(pos.z + dz),
      3
    ),
    true
  );

  await delay(5000);
}

function waitUntilGoalReached(bot: Bot, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      bot.pathfinder?.setGoal(null);
      resolve();
    }, timeout);
    bot.once('goal_reached', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
