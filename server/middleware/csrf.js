/**
 * CSRF protection for state-changing requests.
 *
 * Two-layer defence:
 *  1. Require a custom header (X-Requested-With) on mutating methods.
 *     Browsers block cross-origin custom headers on simple requests,
 *     so a forged form POST from evil.com will be rejected.
 *  2. When an Origin or Referer header is present, verify it matches
 *     one of the allowed origins.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Layer 1: require custom header
  if (!req.headers['x-requested-with']) {
    return res.status(403).json({ message: 'Missing X-Requested-With header' });
  }

  // Layer 2: origin / referer check (if present)
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const source = origin || referer;

  if (source) {
    const allowedOrigins = getAllowedOrigins();
    try {
      const url = new URL(source);
      if (!allowedOrigins.has(url.origin)) {
        return res.status(403).json({ message: 'Cross-origin request blocked' });
      }
    } catch {
      return res.status(403).json({ message: 'Invalid origin' });
    }
  }

  next();
}

function getAllowedOrigins() {
  const origins = new Set([
    'http://localhost:5173',   // Vite dev
    'http://localhost:3001',   // Express dev
  ]);

  // Add production origin from env
  if (process.env.ALLOWED_ORIGIN) {
    process.env.ALLOWED_ORIGIN.split(',').forEach(o => origins.add(o.trim()));
  }

  // Auto-allow twoaveragegamers.com
  origins.add('https://twoaveragegamers.com');
  origins.add('https://www.twoaveragegamers.com');

  return origins;
}

module.exports = csrfProtection;
