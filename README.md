# express-starter-template

Express 5 + TypeScript API starter, production-hardened out of the box. Use it as a base for new services: click "Use this template" on GitHub, or `git clone` and repoint the remote.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Or with Docker: `docker compose up --build` (set `API_PORT` if 3000 is taken on your machine).

## Scripts

| Script                            | Purpose                                     |
| --------------------------------- | ------------------------------------------- |
| `npm run dev`                     | Watch mode via tsx                          |
| `npm run build` / `npm start`     | Compile to `dist/` and run                  |
| `npm run check`                   | lint + typecheck + test + build (run in CI) |
| `npm run lint` / `npm run format` | oxlint / prettier                           |

## What's included

- **helmet** security headers (CSP relaxed only on `/docs` for Swagger UI), **CORS** allow-list, **compression**
- **Rate limiting** (`RATE_LIMIT_*`); health probes are exempt
- **Env validation** with zod: the process exits on boot if config is invalid (`src/config/env.ts`)
- **Structured logging** with pino (auth headers/cookies redacted), request IDs via `x-request-id`
- **Central error handling**: throw `HttpError`, or let `ZodError`/async rejections bubble up
- **Health**: `GET /health/live` (liveness), `GET /health/ready` (readiness — wire up dependency checks as you add them)
- **Graceful shutdown** on SIGTERM/SIGINT, keep-alive tuned for load balancers
- **Swagger UI** at `/docs` from `@openapi` JSDoc in `src/routes/*.ts` (set `DOCS_ENABLED=false` to hide)
- Multi-stage, non-root **Dockerfile** with healthcheck; GitHub Actions **CI**

No database, cache, queue or auth library is included — add what a given project needs. A few notes on that:

- For a database, Prisma (`prisma/schema.prisma` + a driver adapter, e.g. `@prisma/adapter-pg`) is a good default; check its dependency into `/health/ready`.
- For auth, `jsonwebtoken` + `bcrypt` is a common pairing; hash costs and token expiry are project-specific, so they're left out here.
- Wire any new dependency's shutdown into `src/server.ts`'s `shutdown()`, alongside `server.close()`.

## Adding a route

1. Create `src/routes/things.ts` exporting a `Router`; use `validate({ body: schema })` from `src/middleware/validate.ts`.
2. Mount it in `src/app.ts` where marked.
3. Add `@openapi` JSDoc above handlers and a test in `tests/`.

## Production notes

- Set `TRUST_PROXY` to the number of proxies in front of the app, or rate limiting will key on the proxy's IP.
- `CORS_ORIGINS` must be explicit in production (`*` is rejected).
