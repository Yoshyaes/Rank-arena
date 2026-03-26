import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { PROD: false } } });

// We need to test the request function behavior
describe('API module', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should add X-Requested-With header to requests', async () => {
    let capturedHeaders;
    globalThis.fetch = vi.fn(async (url, opts) => {
      capturedHeaders = opts.headers;
      return {
        ok: true,
        json: async () => ({ data: 'test' }),
      };
    });

    // Dynamically import to get fresh module
    const { fetchTodayChallenge } = await import('./api.js');
    await fetchTodayChallenge();

    expect(capturedHeaders['X-Requested-With']).toBe('RankArena');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('should throw on non-ok responses', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    }));

    const { fetchTodayChallenge } = await import('./api.js');
    await expect(fetchTodayChallenge()).rejects.toThrow('Server error');
  });

  it('should handle AbortError as timeout', async () => {
    globalThis.fetch = vi.fn(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    });

    const { fetchTodayChallenge } = await import('./api.js');
    await expect(fetchTodayChallenge()).rejects.toThrow(/timed out/);
  });
});
