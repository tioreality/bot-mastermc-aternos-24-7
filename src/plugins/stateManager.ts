// ============================================================
//   EstelarBot - Gestor de Estado Central
// ============================================================
import { logger } from '../utils/logger';

// Todos los posibles estados del bot
export enum BotState {
  IDLE       = 'IDLE 💤',
  FOLLOWING  = 'FOLLOWING 🚶',
  MINING     = 'MINING ⛏️',
  FARMING    = 'FARMING 🌾',
  GUARDING   = 'GUARDING 🛡️',
  MOVING     = 'MOVING 🏃',
  EATING     = 'EATING 🍖',
  FLEEING    = 'FLEEING 💨',
  COLLECTING = 'COLLECTING 🎒',
  EXPLORING  = 'EXPLORING 🗺️',
  COMBAT     = 'COMBAT ⚔️',
}

let currentState: BotState = BotState.IDLE;
let stateStartTime: number = Date.now();

// Cambiar estado con logging
export function setState(newState: BotState): void {
  if (currentState === newState) return;
  const duration = ((Date.now() - stateStartTime) / 1000).toFixed(1);
  logger.info(`🔄 Estado: ${currentState} → ${newState} (${duration}s en estado anterior)`);
  currentState = newState;
  stateStartTime = Date.now();
}

export function getCurrentState(): BotState {
  return currentState;
}

export function getStateUptime(): number {
  return Date.now() - stateStartTime;
}
