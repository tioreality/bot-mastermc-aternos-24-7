// ============================================================
//   EstelarBot - Handler de Chat y Comandos del Owner
// ============================================================
import { Bot } from 'mineflayer';
import { config } from '../config';
import { logger } from '../utils/logger';
import { discord } from '../utils/discord';
import { saveLocation, getLocation } from '../utils/dataManager';
import { BotState, getCurrentState, setState } from '../plugins/stateManager';

// Comandos disponibles para el owner
const COMMANDS: Record<string, string> = {
  'help':   '📋 Lista de comandos disponibles',
  'follow': '🚶 Seguir al owner',
  'mine':   '⛏️  Modo minería automática',
  'farm':   '🌾 Modo farmeo automático',
  'guard':  '🛡️  Modo guardia (ataca mobs cercanos)',
  'stop':   '🛑 Detener todas las acciones',
  'status': '📊 Ver estado actual del bot',
  'come':   '📍 Venir a la posición del owner',
  'home':   '🏠 Ir al home guardado',
  'sethome':'💾 Guardar posición actual como home',
  'setfarm':'🌱 Guardar posición actual como farm',
  'setmine':'🪨 Guardar posición actual como mine',
  'stealth':'👻 Activar/desactivar modo sigiloso',
  'eat':    '🍖 Comer ahora',
  'armor':  '🛡️  Equipar mejor armadura disponible',
  'inv':    '🎒 Ver resumen del inventario',
  'coords': '📍 Decir coordenadas actuales en el chat',
  'say':    '💬 Decir algo en el chat (/bot say <msg>)',
};

export function setupChatHandler(bot: Bot): void {
  bot.on('chat', async (username: string, message: string) => {
    // Solo el owner puede dar órdenes
    if (username === bot.username) return; // Ignorar mensajes propios

    const isOwner = username === config.owner;
    const isCommand = message.toLowerCase().startsWith('/bot ');

    if (!isCommand) return; // Solo procesar comandos /bot

    const parts = message.slice(5).trim().split(' ');
    const cmd = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);

    // Log y notificación Discord
    logger.info(`👑 Comando recibido de ${username}: ${message}`);
    if (isOwner) discord.ownerCommand(username, message).catch(() => {});

    // Si no es el owner, solo permitir comandos de info públicos
    if (!isOwner) {
      if (cmd === 'status' || cmd === 'coords') {
        // Permitir a cualquier jugador ver el estado
      } else {
        bot.chat(`⭐ Solo ${config.owner} puede darme órdenes, ${username}.`);
        return;
      }
    }

    await handleCommand(bot, username, cmd, args);
  });

  logger.info('💬 Handler de chat configurado');
}

async function handleCommand(bot: Bot, sender: string, cmd: string, args: string[]): Promise<void> {
  switch (cmd) {
    case 'help': {
      const lines = Object.entries(COMMANDS).map(([k, v]) => `/bot ${k} - ${v}`);
      bot.chat(`⭐ Comandos disponibles:`);
      // Enviar en partes para no spamear
      for (let i = 0; i < lines.length; i += 3) {
        await delay(600);
        bot.chat(lines.slice(i, i + 3).join(' | '));
      }
      break;
    }

    case 'follow': {
      const target = bot.players[sender]?.entity;
      if (!target) { bot.chat(`❌ No te veo, ${sender}.`); return; }
      setState(BotState.FOLLOWING);
      bot.chat(`🚶 Siguiéndote, ${sender}!`);
      break;
    }

    case 'mine': {
      setState(BotState.MINING);
      bot.chat('⛏️ Iniciando modo minería automática!');
      break;
    }

    case 'farm': {
      setState(BotState.FARMING);
      bot.chat('🌾 Iniciando modo farmeo automático!');
      break;
    }

    case 'guard': {
      setState(BotState.GUARDING);
      bot.chat('🛡️ Modo guardia activado. ¡Protegiéndote!');
      break;
    }

    case 'stop': {
      setState(BotState.IDLE);
      bot.pathfinder?.setGoal(null);
      bot.chat('🛑 Detenido. En espera de órdenes.');
      break;
    }

    case 'status': {
      const state = getCurrentState();
      const hp = bot.health?.toFixed(1) ?? '?';
      const food = bot.food ?? '?';
      const pos = bot.entity?.position;
      const coords = pos ? `${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}` : '?';
      bot.chat(`📊 Estado: ${state} | ❤️ ${hp}/20 | 🍖 ${food}/20 | 📍 ${coords}`);
      break;
    }

    case 'come': {
      const ownerEntity = bot.players[sender]?.entity;
      if (!ownerEntity) { bot.chat(`❌ No encuentro tu posición.`); return; }
      const { GoalNear } = await import('mineflayer-pathfinder').then(m => m.goals);
      setState(BotState.MOVING);
      bot.pathfinder.setGoal(new GoalNear(ownerEntity.position.x, ownerEntity.position.y, ownerEntity.position.z, 2));
      bot.chat(`🚀 ¡Voy hacia ti, ${sender}!`);
      break;
    }

    case 'home': {
      const home = getLocation('home');
      if (!home) { bot.chat('❌ No tengo home guardado. Usa /bot sethome primero.'); return; }
      const { GoalBlock } = await import('mineflayer-pathfinder').then(m => m.goals);
      setState(BotState.MOVING);
      bot.pathfinder.setGoal(new GoalBlock(home.x, home.y, home.z));
      bot.chat(`🏠 Yendo al home (${home.x}, ${home.y}, ${home.z})`);
      break;
    }

    case 'sethome': {
      const pos = bot.entity?.position;
      if (!pos) return;
      saveLocation('home', pos);
      bot.chat(`💾 Home guardado en (${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)})`);
      break;
    }

    case 'setfarm': {
      const pos = bot.entity?.position;
      if (!pos) return;
      saveLocation('farm', pos);
      bot.chat(`🌱 Granja guardada.`);
      break;
    }

    case 'setmine': {
      const pos = bot.entity?.position;
      if (!pos) return;
      saveLocation('mine', pos);
      bot.chat(`🪨 Mina guardada.`);
      break;
    }

    case 'stealth': {
      config.stealthMode = !config.stealthMode;
      bot.chat(`👻 Modo sigiloso: ${config.stealthMode ? 'ACTIVADO' : 'DESACTIVADO'}`);
      break;
    }

    case 'coords': {
      const pos = bot.entity?.position;
      if (!pos) return;
      bot.chat(`📍 Estoy en: X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}`);
      break;
    }

    case 'inv': {
      const items = bot.inventory.items();
      if (items.length === 0) { bot.chat('🎒 Inventario vacío.'); return; }
      const summary = items.slice(0, 6).map(i => `${i.name}x${i.count}`).join(', ');
      bot.chat(`🎒 Inventario: ${summary}${items.length > 6 ? ` (+${items.length - 6} más)` : ''}`);
      break;
    }

    case 'say': {
      if (args.length === 0) { bot.chat('Uso: /bot say <mensaje>'); return; }
      bot.chat(args.join(' '));
      break;
    }

    default: {
      bot.chat(`❓ Comando desconocido: ${cmd}. Usa /bot help para ver los comandos.`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
