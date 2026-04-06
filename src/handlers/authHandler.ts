// ============================================================
//   EstelarBot - Handler de Autenticación (LoginSecurity)
// ============================================================
import { Bot } from 'mineflayer';
import { config } from '../config';
import { logger } from '../utils/logger';

// Mensajes que indican que el bot necesita registrarse
const REGISTER_TRIGGERS = [
  'please register',
  '/register',
  'register with',
  'use /register',
  'you need to register',
  'registrate',
  'regístrate',
  'para registrarte',
];

// Mensajes que indican que el bot necesita loguearse
const LOGIN_TRIGGERS = [
  'please login',
  '/login',
  'you need to login',
  'use /login',
  'log in to',
  'inicia sesión',
  'inicia sesion',
  'para iniciar',
  'please authenticate',
];

// Mensajes de confirmación de login exitoso
const SUCCESS_TRIGGERS = [
  'you have been logged in',
  'successfully logged',
  'welcome back',
  'logged in',
  'has iniciado',
  'bienvenido',
];

// Estado de autenticación
let isAuthenticated = false;
let authAttempts = 0;
const MAX_AUTH_ATTEMPTS = 5;

export function setupAuthHandler(bot: Bot): void {
  isAuthenticated = false;
  authAttempts = 0;

  // Escucha mensajes del chat para detectar solicitudes de auth
  bot.on('messagestr', async (message: string) => {
    const msg = message.toLowerCase();

    // Verificar si el bot está autenticado
    if (SUCCESS_TRIGGERS.some(t => msg.includes(t))) {
      isAuthenticated = true;
      authAttempts = 0;
      logger.info('✅ Autenticación exitosa con LoginSecurity');
      return;
    }

    // Solicitud de login
    if (!isAuthenticated && LOGIN_TRIGGERS.some(t => msg.includes(t))) {
      if (authAttempts >= MAX_AUTH_ATTEMPTS) {
        logger.error(`❌ Máximo de intentos de login alcanzado (${MAX_AUTH_ATTEMPTS}). Revisa la contraseña.`);
        return;
      }
      authAttempts++;
      logger.info(`🔐 Solicitud de login detectada (intento ${authAttempts}). Ejecutando /login...`);
      await delay(800 + Math.random() * 600); // Delay humano
      try {
        await bot.chat(`/login ${config.password}`);
      } catch (err) {
        logger.error('Error al ejecutar /login:', err);
      }
      return;
    }

    // Solicitud de registro
    if (!isAuthenticated && REGISTER_TRIGGERS.some(t => msg.includes(t))) {
      if (authAttempts >= MAX_AUTH_ATTEMPTS) {
        logger.error('❌ Máximo de intentos de registro alcanzado.');
        return;
      }
      authAttempts++;
      logger.info(`📝 Solicitud de registro detectada (intento ${authAttempts}). Ejecutando /register...`);
      await delay(1000 + Math.random() * 800);
      try {
        await bot.chat(`/register ${config.password} ${config.password}`);
      } catch (err) {
        logger.error('Error al ejecutar /register:', err);
      }
    }
  });

  // También escucha en actionBar (algunos plugins lo usan)
  bot.on('actionBar', (jsonMsg: { toString: () => string }) => {
    const msg = jsonMsg.toString().toLowerCase();
    if (LOGIN_TRIGGERS.some(t => msg.includes(t)) && !isAuthenticated) {
      logger.debug('Login solicitado vía actionBar');
      bot.chat(`/login ${config.password}`).catch(() => {});
    }
  });

  logger.info('🔑 Handler de autenticación LoginSecurity configurado');
}

export function getAuthStatus(): boolean {
  return isAuthenticated;
}

export function resetAuth(): void {
  isAuthenticated = false;
  authAttempts = 0;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
