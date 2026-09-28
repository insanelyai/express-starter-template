import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { healthRouter } from './routes/health.js';

export const app: Application = express();

app.set('trust proxy', env.TRUST_PROXY);

// Swagger UI needs inline scripts/styles, so it gets its own helmet without CSP.
// It is mounted before the global helmet so the strict CSP doesn't apply here.
if (env.DOCS_ENABLED) {
  app.use(
    '/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec),
  );
}

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.includes('*') ? '*' : env.CORS_ORIGINS,
    credentials: !env.CORS_ORIGINS.includes('*'),
  }),
);
app.use(compression());
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
  }),
);

// Health probes sit before the rate limiter so orchestrators are never throttled.
app.use('/health', healthRouter);

app.use(apiLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Mount feature routers here, e.g. app.use('/api/v1/users', usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);
