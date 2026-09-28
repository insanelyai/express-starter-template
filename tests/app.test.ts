import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('security & platform middleware', () => {
  it('sets helmet headers and hides x-powered-by', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('allows configured CORS origins only', async () => {
    const ok = await request(app).get('/health/live').set('Origin', 'http://allowed.test');
    expect(ok.headers['access-control-allow-origin']).toBe('http://allowed.test');
    const bad = await request(app).get('/health/live').set('Origin', 'http://evil.test');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it('returns 400 for malformed JSON without leaking internals', async () => {
    const res = await request(app)
      .post('/nope')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.stack).toBeUndefined();
  });

  it('rejects oversized bodies', async () => {
    const res = await request(app)
      .post('/nope')
      .send({ data: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
  });
});

describe('health', () => {
  it('liveness is ok', async () => {
    const res = await request(app).get('/health/live');
    expect(res.body.status).toBe('ok');
  });

  it('readiness is ok', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('docs', () => {
  it('serves swagger UI with health endpoints documented', async () => {
    const ui = await request(app).get('/docs/');
    expect(ui.status).toBe(200);
    const { swaggerSpec } = await import('../src/config/swagger.js');
    expect(Object.keys((swaggerSpec as { paths: object }).paths)).toContain('/health/live');
  });
});
