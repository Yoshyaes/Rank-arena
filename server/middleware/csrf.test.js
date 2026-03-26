import { describe, it, expect, vi } from 'vitest';

const csrfProtection = require('./csrf');

function createReq(method, headers = {}) {
  return { method, headers };
}

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

describe('CSRF middleware', () => {
  it('should allow GET requests without custom header', () => {
    const req = createReq('GET');
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow HEAD requests without custom header', () => {
    const req = createReq('HEAD');
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow OPTIONS requests without custom header', () => {
    const req = createReq('OPTIONS');
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject POST without X-Requested-With header', () => {
    const req = createReq('POST');
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/X-Requested-With/);
  });

  it('should allow POST with X-Requested-With header', () => {
    const req = createReq('POST', { 'x-requested-with': 'RankArena' });
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject POST with X-Requested-With but cross-origin', () => {
    const req = createReq('POST', {
      'x-requested-with': 'RankArena',
      origin: 'https://evil.com',
    });
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Cross-origin/);
  });

  it('should allow POST from allowed origin', () => {
    const req = createReq('POST', {
      'x-requested-with': 'RankArena',
      origin: 'https://twoaveragegamers.com',
    });
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow POST from localhost dev origin', () => {
    const req = createReq('POST', {
      'x-requested-with': 'RankArena',
      origin: 'http://localhost:5173',
    });
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject PUT without X-Requested-With header', () => {
    const req = createReq('PUT');
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('should handle invalid origin URL gracefully', () => {
    const req = createReq('POST', {
      'x-requested-with': 'RankArena',
      origin: 'not-a-url',
    });
    const res = createRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
