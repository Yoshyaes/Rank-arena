# Fixes Applied — Code Review Remediation

Branch: `fix/code-review-issues`

All findings from `code-review.md` addressed in priority order.

---

## Critical (P0)

### C1 — Unescaped User Input Injected into SVG
**File:** `server/routes/share.js`

`req.query.c`, `req.query.trail`, and `req.query.d` were inserted into a
raw SVG string that `sharp`/libvips rasterized to PNG with no input validation
or escaping.

- **`statCategory`**: Strict allowlist — `STAT_LABELS[req.query.c] ? req.query.c : 'metacritic'`.
  Unknown categories are silently defaulted to `'metacritic'`; the raw input
  string is never used as a label or interpolated anywhere.
- **`trail`**: Capped to 20 characters via `.slice(0, 20)` and sanitized to
  `[01]` characters only via `.replace(/[^01]/g, '')`. Eliminates the O(n) SVG
  generation DoS.
- **`dateStr`**: Validated against `/^\d{4}-\d{2}-\d{2}$/`; falls back to
  server date if format doesn't match.
- **`svgEscape()`**: New helper that escapes `&`, `<`, `>`, `"` in any string
  before SVG interpolation. Applied to `statLabel`, `formattedDate`, and
  `commentary`.

### C2 — Wildcard CORS on All Routes
**File:** `server/index.js`

`app.use(cors())` broadcasted `Access-Control-Allow-Origin: *` on every route,
allowing any website to make credentialed API requests.

Replaced with:
```js
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
```
`ALLOWED_ORIGIN` is now documented in `.env.example`.

---

## High Priority

### H1 — No HTTP Security Headers
**File:** `server/index.js`

Added `helmet` as a dependency and applied `app.use(helmet())` before all
other middleware. Helmet sets `Content-Security-Policy`, `X-Frame-Options`,
`X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`,
`Permissions-Policy`, and `X-DNS-Prefetch-Control` on every response.

### H2 — WordPress HMAC Verification Is Optional
**Files:** `server/routes/challenge.js`, `server/routes/endless.js`

The old pattern checked `if (wpSecret) { verify }` — if `WP_AUTH_SECRET` was
absent from the environment, any `wp_user_id` was silently accepted without
verification.

Both routes now fail-secure:
```js
const wpSecret = process.env.WP_AUTH_SECRET;
if (!wpSecret) {
  return res.status(503).json({ message: 'WordPress authentication is not configured on this server' });
}
// Always verify HMAC
```
The HMAC check is performed unconditionally when `wp_user_id` is present.

### H3 — Unvalidated `wp_user_id` in Leaderboard Routes
**File:** `server/routes/leaderboard.js`

`req.query.wp_user_id` was concatenated into `userId` without any type or
format validation. Both `/leaderboard/daily` and `/leaderboard/endless` now
validate with `/^\d+$/` and return HTTP 400 if the value is present but
non-numeric.

### H4 — No Explicit Request Body Size Limit
**File:** `server/index.js`

Changed `app.use(express.json())` to `app.use(express.json({ limit: '50kb' }))`.
Express's default (100 KB) was not explicit and the share route's query-string
DoS vector was covered by the C1 fixes.

### H5 — Admin Rate Limiter Applied After Auth Middleware
**File:** `server/routes/admin.js`

Changed from per-route `router.post('/challenge', adminAuth, adminLimiter, ...)`
to router-level middleware in the correct order:
```js
router.use(adminLimiter);   // counts ALL attempts, including failed auth
router.use(adminAuth);      // auth runs after rate limit is recorded
```
Failed authentication attempts now count against the rate limit, preventing
unlimited brute force.

### H6 — Admin Password Compared with `!==`
**File:** `server/middleware/adminAuth.js`

`password !== process.env.ADMIN_PASSWORD` short-circuits on the first
differing byte, leaking timing information.

Replaced with:
```js
const { timingSafeEqual } = require('crypto');
const provided = Buffer.from(password || '');
const expected = Buffer.from(process.env.ADMIN_PASSWORD || '');
if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) { ... }
```

---

## Medium Priority

### M1 — RAWG API Key Exposed in URL Query Parameter
**File:** `server/scripts/fetchCovers.js`

RAWG's API does not support `Authorization` headers — the key must be in the
URL. Added a comment documenting this constraint and the mitigation requirement
(access-controlled logs, key rotation if exposed). This is a one-off admin
script; the key is never sent to browsers.

### M2 — Magic Number for Endless Score Validation
**File:** `server/routes/endless.js`

Extracted `const ENDLESS_MAX_SCORE = 500` with a comment explaining the game
math (50 rounds × 10 points/round). The validation expression now references
the named constant.

### M3 — In-Memory Challenge Cache Breaks Multi-Process Deployments
**File:** `server/routes/challenge.js`

Removed module-level `cachedChallenge` / `cachedDate` variables.
`getTodayChallenge()` now always reads from SQLite. SQLite is a local file
database that is fast enough for this read pattern, and every process reads
the same data regardless of how many workers are running.

### M4 — Missing Variables in `.env.example`
**File:** `.env.example`

Added all five previously undocumented variables with explanatory comments:
- `WP_AUTH_SECRET` — required for WordPress identity verification (see H2)
- `VITE_SUPABASE_URL` — Vite-prefixed Supabase URL for the client build
- `VITE_SUPABASE_ANON_KEY` — Vite-prefixed anon key for the client build
- `SQLITE_PATH` — path to the SQLite database file
- `ALLOWED_ORIGIN` — CORS allowed origin (see C2)

### M5 — PHP Proxy Path Traversal Risk
**File:** `server/api-proxy.php`

`ltrim($path, '/')` stripped leading slashes but did not prevent `..` sequences
in the middle of the path (e.g. `challenge/../../admin` → forwards to
`http://127.0.0.1:3001/admin`).

Added an explicit check before building `$target`:
```php
if (strpos($path, '..') !== false) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid path']);
    exit;
}
```
