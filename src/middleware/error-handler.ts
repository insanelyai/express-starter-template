import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { isProd } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Route ${req.method} ${req.path} not found`));
};

// Express 5 forwards rejected promises from async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof HttpError) {
    ({ status, message, details } = err);
  } else if (err instanceof z.ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    // Errors raised by body-parser / http-errors (malformed JSON, payload too large, ...)
    status = err.status;
    message = err.expose ? err.message : 'Bad request';
  }

  if (status >= 500) {
    req.log.error({ err }, 'unhandled error');
  }

  res.status(status).json({
    error: {
      message,
      ...(details !== undefined && { details }),
      ...(!isProd && status >= 500 && { stack: err?.stack }),
    },
  });
};
