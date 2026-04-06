// ============================================================
//   EstelarBot - Handler de Combate y Supervivencia
// ============================================================
import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { config } from '../config';
import { logger } from '../utils/logger';
import { discord } from '../utils/discord';
import { escapeFromDanger } from './movementHandler';
import { BotState, getCurrentState, setState } from '../plugins/stateManager';

// Salud crítica para huir
const FLEE_HEALTH = 6;
// Salud para dejar de huir y volver
const SAFE_HEALTH = 14;

let combatActive = false;
let fleeingFromDanger = false;

// Inicializar el sistema de combate
export function setupCombatHandler(bot: Bot): void {
  // Verificar salud constantemente
  bot.on('health', async () => {
    const hp = bot.health;
    const food = bot.food;

    // Salud crítica: huir
    if (hp <= FLEE_HEALTH && !fleeingFromDanger) {
      fleeingFromDanger = true;
      logger.warn(`💔 Salud crítica: ${hp.toFixed(1)}/20. Huyendo...`);
      setState(BotState.FLEEING);
      bot.pvp?.stop();
      combatActive = false;
      await escapeFromDanger(bot).catch(() => {});
    }

    // Recuperado: volver a estado idle
    if (hp >= SAFE_HEALTH && fleeingFromDanger) {
      fleeingFromDanger = false;
      logger.info(`💚 Salud recuperada: ${hp.toFixed(1)}/20`);
      if (getCurrentState() === BotState.FLEEING) {
        setState(BotState.IDLE);
      }
    }
  });

  // Detección de mobs hostiles cercanos
  bot.on('physicsTick', () => {
    if (fleeingFromDanger || getCurrentState() === BotState.FLEEING) return;
    if (getCurrentState() === BotState.FOLLOWING || getCurrentState() === BotState.GUARDING) {
      detectAndAttackNearbyHostiles(bot);
    }
    // En modo guard, siempre atacar
    if (getCurrentState() === BotState.GUARDING) {
      detectAndAttackNearbyHostiles(bot);
    }
  });

  // Evento de muerte
  bot.on('death', async () => {
    combatActive = false;
    fleeingFromDanger = false;
    logger.warn('💀 ¡El bot ha muerto!');
    const { recordDeath } = await import('../utils/dataManager');
    recordDeath();
    discord.botDied('Causa desconocida (muerte en servidor)').catch(() => {});
    setState(BotState.IDLE);
  });

  logger.info('⚔️ Handler de combate configurado');
}

// Detectar y atacar mobs hostiles cercanos
function detectAndAttackNearbyHostiles(bot: Bot): void {
  if (combatActive || !bot.entity) return;

  // Buscar el mob hostil más cercano
  const hostileMob = findNearestHostile(bot, 8);
  if (!hostileMob) return;

  combatActive = true;
  logger.info(`⚔️ Atacando mob: ${hostileMob.name} (${hostileMob.position.distanceTo(bot.entity.position).toFixed(1)} bloques)`);

  try {
    bot.pvp.attack(hostileMob);
    // El pvp plugin maneja el combate; escuchar cuando termina
    bot.once('stoppedAttacking', () => {
      combatActive = false;
    });
  } catch (err) {
    combatActive = false;
    logger.debug('Error al atacar mob:', err);
  }
}

// Encontrar el mob hostil más cercano dentro de un radio
function findNearestHostile(bot: Bot, maxDistance: number): Entity | null {
  if (!bot.entity) return null;

  let nearest: Entity | null = null;
  let nearestDist = maxDistance;

  for (const entity of Object.values(bot.entities)) {
    if (!entity || entity.id === bot.entity.id) continue;
    if (entity.type !== 'mob') continue;

    // Verificar si es un mob hostil
    const name = entity.name?.toLowerCase() || '';
    if (!config.hostileMobs.some(mob => name.includes(mob))) continue;

    // Modo sigiloso: ignorar si no es amenaza directa (hp > 15)
    if (config.stealthMode && bot.health > 15) continue;

    const dist = entity.position.distanceTo(bot.entity.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = entity;
    }
  }

  return nearest;
}

// Atacar a un jugador específico (solo si el owner lo ordena)
export async function attackPlayer(bot: Bot, targetName: string): Promise<void> {
  const target = bot.players[targetName]?.entity;
  if (!target) {
    logger.warn(`No se encontró al jugador: ${targetName}`);
    return;
  }
  combatActive = true;
  bot.pvp.attack(target);
  bot.once('stoppedAttacking', () => { combatActive = false; });
}

export function isCombatActive(): boolean {
  return combatActive;
}

export function isFleeingFromDanger(): boolean {
  return fleeingFromDanger;
}
