import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'test-secret-123';
});

const adminAuth = require('./adminAuth');

function createReq(authHeader) {
  return { headers: { authorization: authHeader } };
}

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
    setHeader(key, val) { res.headers[key] = val; return res; },
  };
  return res;
}

describe('adminAuth middleware', () => {
  it('should reject requests without auth header', () => {
    const req = { headers: {} };
    const res = createRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject non-Basic auth', () => {
    const req = createReq('Bearer some-token');
    const res = createRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject wrong password', () => {
    const encoded = Buffer.from('admin:wrong-password').toString('base64');
    const req = createReq(`Basic ${encoded}`);
    const res = createRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('should allow correct password', () => {
    const encoded = Buffer.from('admin:test-secret-123').toString('base64');
    const req = createReq(`Basic ${encoded}`);
    const res = createRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should set WWW-Authenticate header on 401', () => {
    const req = { headers: {} };
    const res = createRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(res.headers['WWW-Authenticate']).toMatch(/Basic/);
  });
});
