// ============================================================
//   EstelarBot - Configuración central
// ============================================================
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Conexión
  host: process.env.MC_HOST || 'estelar_oficial.aternos.me',
  port: parseInt(process.env.MC_PORT || '52863'),
  version: process.env.MC_VERSION || '1.21.1',

  // Identidad
  username: process.env.BOT_USERNAME || 'EstelarGuard',
  password: process.env.BOT_PASSWORD || '',

  // Owner
  owner: process.env.OWNER_USERNAME || '',

  // Reconexión exponencial
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY_MS || '10000'),
  reconnectMaxDelay: parseInt(process.env.RECONNECT_MAX_DELAY_MS || '120000'),

  // Discord
  discordWebhook: process.env.DISCORD_WEBHOOK_URL || '',

  // Comportamiento
  eatFoodLevel: parseInt(process.env.EAT_FOOD_LEVEL || '14'),
  maxPathfindDistance: parseInt(process.env.MAX_PATHFIND_DISTANCE || '150'),
  stealthMode: process.env.STEALTH_MODE === 'true',
  debug: process.env.DEBUG_MODE === 'true',

  // Archivos de datos
  dataFile: './data/locations.json',

  // Frases que el bot puede decir (anti-AFK chat)
  idleMessages: [
    '⭐ Explorando las estrellas...',
    '🚀 Vigilando la base estelar',
    '🌌 Todo tranquilo por aquí',
    '✨ El cosmos está en paz',
    '🛸 Escaneando el perímetro',
  ],

  // Bloques de cultivo que el bot puede farmear
  farmableCrops: ['wheat', 'carrots', 'potatoes', 'beetroot', 'sugar_cane', 'melon', 'pumpkin'],

  // Minerales prioritarios (orden de prioridad)
  priorityOres: ['diamond_ore', 'deepslate_diamond_ore', 'ancient_debris', 'gold_ore', 'deepslate_gold_ore', 'iron_ore', 'deepslate_iron_ore', 'coal_ore', 'deepslate_coal_ore'],

  // Mobs peligrosos
  hostileMobs: ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch', 'pillager', 'vindicator', 'phantom', 'drowned', 'husk'],
};
