// ============================================================
//   EstelarBot - Plugin de Farmeo Automático
// ============================================================
import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import { logger } from '../utils/logger';
import { config } from '../config';
import { BotState, getCurrentState, setState } from './stateManager';

// Bloques de cultivo completamente crecidos (edad máxima)
const CROP_MAX_AGE: Record<string, number> = {
  wheat:     7,
  carrots:   7,
  potatoes:  7,
  beetroot:  3,
  nether_wart: 3,
};

let farmingActive = false;
let farmingInterval: NodeJS.Timeout | null = null;

// Iniciar el ciclo de farmeo automático
export function startFarming(bot: Bot): void {
  if (farmingActive) return;
  farmingActive = true;
  setState(BotState.FARMING);
  logger.info('🌾 Iniciando ciclo de farmeo...');
  farmingInterval = setInterval(() => farmingTick(bot), 2000);
}

// Detener el ciclo de farmeo
export function stopFarming(): void {
  farmingActive = false;
  if (farmingInterval) {
    clearInterval(farmingInterval);
    farmingInterval = null;
  }
  logger.info('🌾 Farmeo detenido');
}

// Un ciclo de farmeo
async function farmingTick(bot: Bot): Promise<void> {
  if (!farmingActive || getCurrentState() !== BotState.FARMING) return;
  if (!bot.entity) return;

  try {
    // Buscar cultivos maduros cercanos
    const matureCrop = findMatureCrop(bot);
    if (matureCrop) {
      await harvestCrop(bot, matureCrop);
      return;
    }

    // Buscar caña de azúcar
    const sugarCane = findSugarCane(bot);
    if (sugarCane) {
      await harvestSugarCane(bot, sugarCane);
      return;
    }

    // Recoger items del suelo
    await collectNearbyItems(bot);

  } catch (err) {
    logger.debug('Error en farmingTick:', err);
  }
}

// Buscar un cultivo maduro cercano
function findMatureCrop(bot: Bot): any {
  const pos = bot.entity!.position;

  for (const [cropName, maxAge] of Object.entries(CROP_MAX_AGE)) {
    // Buscar hasta 32 bloques
    const cropBlock = bot.findBlock({
      matching: bot.registry.blocksByName[cropName]?.id,
      maxDistance: 32,
      useExtraInfo: (block) => {
        // Verificar que está completamente crecido
        const ageProperty = block.getProperties?.()?.age;
        return ageProperty !== undefined && parseInt(String(ageProperty)) >= maxAge;
      },
    });
    if (cropBlock) return cropBlock;
  }
  return null;
}

// Buscar caña de azúcar mayor de 1 bloque de alto
function findSugarCane(bot: Bot): any {
  return bot.findBlock({
    matching: bot.registry.blocksByName['sugar_cane']?.id,
    maxDistance: 32,
    useExtraInfo: (block) => {
      // Solo cortar si hay otro bloque de caña encima (altura > 1)
      const below = bot.blockAt(block.position.offset(0, -1, 0));
      return below?.name === 'sugar_cane';
    },
  });
}

// Cosechar un cultivo
async function harvestCrop(bot: Bot, block: any): Promise<void> {
  const { GoalBlock } = await import('mineflayer-pathfinder').then(m => m.goals);
  try {
    bot.pathfinder.setGoal(new GoalBlock(block.position.x, block.position.y, block.position.z));
    await waitUntilGoalReached(bot, 5000);
    await bot.dig(block);
    logger.debug(`🌾 Cosechado: ${block.name} en (${block.position.x}, ${block.position.y}, ${block.position.z})`);
    await delay(300);
  } catch (err) {
    logger.debug('Error cosechando:', err);
  }
}

// Cosechar caña de azúcar (solo el bloque del medio/arriba)
async function harvestSugarCane(bot: Bot, block: any): Promise<void> {
  try {
    await bot.dig(block);
    await delay(300);
  } catch (err) {
    logger.debug('Error cosechando caña:', err);
  }
}

// Recoger items del suelo cercanos
async function collectNearbyItems(bot: Bot): Promise<void> {
  if (!bot.entity) return;
  const items = Object.values(bot.entities).filter(e =>
    e.type === 'object' &&
    e.objectType === 'Item' &&
    e.position.distanceTo(bot.entity!.position) < 8
  );
  if (items.length > 0) {
    const nearest = items.reduce((a, b) =>
      a.position.distanceTo(bot.entity!.position) < b.position.distanceTo(bot.entity!.position) ? a : b
    );
    const { GoalNear } = await import('mineflayer-pathfinder').then(m => m.goals);
    bot.pathfinder.setGoal(new GoalNear(nearest.position.x, nearest.position.y, nearest.position.z, 1), true);
  }
}

// Esperar a que el pathfinder llegue al goal
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
