// ============================================================
//   EstelarBot - Sistema de logs con Winston
// ============================================================
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

const { combine, timestamp, colorize, printf, errors } = winston.format;

// Formato personalizado con emojis para la consola
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const emoji: Record<string, string> = {
    error: '❌',
    warn:  '⚠️ ',
    info:  '🌟',
    debug: '🔍',
  };
  const icon = emoji[level] || '📋';
  return `${timestamp} ${icon} [${level.toUpperCase()}] ${stack || message}`;
});

// Transporte a archivo rotativo
const fileTransport = new DailyRotateFile({
  filename: 'logs/estelarbot-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
});

export const logger = winston.createLogger({
  level: config.debug ? 'debug' : 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'HH:mm:ss' })),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
    fileTransport,
  ],
});
