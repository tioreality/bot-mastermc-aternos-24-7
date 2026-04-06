// ============================================================
//   EstelarBot - Gestor de datos persistentes (JSON)
// ============================================================
import fs from 'fs';
import path from 'path';
import { Vec3 } from 'vec3';
import { logger } from './logger';
import { config } from '../config';

export interface LocationData {
  home?: { x: number; y: number; z: number };
  farm?: { x: number; y: number; z: number };
  mine?: { x: number; y: number; z: number };
  base?: { x: number; y: number; z: number };
  [key: string]: { x: number; y: number; z: number } | undefined;
}

export interface BotData {
  locations: LocationData;
  stats: {
    deaths: number;
    totalOnlineTime: number;
    lastSeen: string;
  };
}

const defaultData: BotData = {
  locations: {},
  stats: {
    deaths: 0,
    totalOnlineTime: 0,
    lastSeen: new Date().toISOString(),
  },
};

// Asegura que el directorio data/ exista
function ensureDataDir(): void {
  const dir = path.dirname(config.dataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Carga datos del disco
export function loadData(): BotData {
  ensureDataDir();
  try {
    if (!fs.existsSync(config.dataFile)) {
      saveData(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(config.dataFile, 'utf-8');
    return JSON.parse(raw) as BotData;
  } catch (err) {
    logger.error('Error cargando datos, usando valores por defecto', err);
    return defaultData;
  }
}

// Guarda datos al disco
export function saveData(data: BotData): void {
  ensureDataDir();
  try {
    fs.writeFileSync(config.dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error('Error guardando datos:', err);
  }
}

// Guarda una ubicación nombrada
export function saveLocation(name: string, pos: Vec3): void {
  const data = loadData();
  data.locations[name] = { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) };
  saveData(data);
  logger.info(`📍 Ubicación guardada: ${name} -> (${data.locations[name]!.x}, ${data.locations[name]!.y}, ${data.locations[name]!.z})`);
}

// Obtiene una ubicación guardada como Vec3
export function getLocation(name: string): Vec3 | null {
  const data = loadData();
  const loc = data.locations[name];
  if (!loc) return null;
  return new Vec3(loc.x, loc.y, loc.z);
}

// Incrementa contador de muertes
export function recordDeath(): void {
  const data = loadData();
  data.stats.deaths++;
  data.stats.lastSeen = new Date().toISOString();
  saveData(data);
}
