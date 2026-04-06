// ============================================================
//   EstelarBot - Notificaciones a Discord (Webhook)
// ============================================================
import axios from 'axios';
import { config } from '../config';
import { logger } from './logger';

export enum NotifLevel {
  INFO = 0x3498db,      // Azul
  SUCCESS = 0x2ecc71,   // Verde
  WARNING = 0xe67e22,   // Naranja
  DANGER = 0xe74c3c,    // Rojo
  DEATH = 0x9b59b6,     // Morado
}

// Envía una notificación al webhook de Discord
export async function notify(title: string, description: string, level: NotifLevel = NotifLevel.INFO): Promise<void> {
  if (!config.discordWebhook) return; // Desactivado si no hay webhook

  const payload = {
    username: '🌟 EstelarBot',
    avatar_url: 'https://i.imgur.com/zYrLIzU.png',
    embeds: [
      {
        title,
        description,
        color: level,
        timestamp: new Date().toISOString(),
        footer: { text: `EstelarBot • ${config.host}` },
      },
    ],
  };

  try {
    await axios.post(config.discordWebhook, payload, { timeout: 5000 });
  } catch (err) {
    logger.debug('No se pudo enviar notificación a Discord:', err);
  }
}

// Atajos comunes
export const discord = {
  botOnline: () => notify('🟢 Bot en línea', `**${config.username}** se conectó al servidor **${config.host}**`, NotifLevel.SUCCESS),
  botOffline: (reason: string) => notify('🔴 Bot desconectado', `Razón: ${reason}\nReconectando...`, NotifLevel.WARNING),
  botDied: (reason: string) => notify('💀 Bot murió', `Causa: **${reason}**`, NotifLevel.DEATH),
  ownerCommand: (owner: string, cmd: string) => notify('👑 Comando del Owner', `**${owner}** ejecutó: \`${cmd}\``, NotifLevel.INFO),
  error: (msg: string) => notify('❌ Error crítico', msg, NotifLevel.DANGER),
};
