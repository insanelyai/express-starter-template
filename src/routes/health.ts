import { Router } from 'express';

export const healthRouter = Router();

/**
 * @openapi
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     responses:
 *       200:
 *         description: Process is up
 */
healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe
 *     responses:
 *       200:
 *         description: Ready to receive traffic
 *       503:
 *         description: A dependency is unavailable
 */
// No external dependencies yet, so this mirrors /health/live. Once you add one
// (a database, a queue, ...), check it here with a short timeout and return 503 if it's down -
// don't let a slow dependency hang the probe itself, since orchestrators expect a fast answer.
healthRouter.get('/ready', (_req, res) => {
  res.json({ status: 'ok' });
});
