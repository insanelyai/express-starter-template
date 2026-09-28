import { pino } from 'pino';
import { env, isProd } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
    ],
    censor: '[redacted]',
  },
  ...(isProd ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});
