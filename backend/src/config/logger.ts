// ============================================================
// /backend/src/config/logger.ts
// ============================================================
import winston from 'winston';
import { config } from './index';

export const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.isDev
      ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/vendor-escalation.log', level: 'error' }), // Added for API API SOP
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
