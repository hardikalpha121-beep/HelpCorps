import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Dev-friendly console format
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${ts} [${level}]: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
  ),
  defaultMeta: { service: 'helpcorps-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: env.NODE_ENV === 'production'
        ? combine(json())
        : combine(colorize(), devFormat),
    }),
    // File transport for errors (production)
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5_242_880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5_242_880,
            maxFiles: 5,
          }),
        ]
      : []),
  ]
});
