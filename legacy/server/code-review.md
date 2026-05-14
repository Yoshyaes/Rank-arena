# Rank-Arena — Comprehensive Code Review

**Date:** 2026-04-08
**Reviewer:** Claude (automated)
**Stack:** Express.js + better-sqlite3 · React + Vite · Supabase auth · WordPress PHP integration · sharp (SVG→PNG)

---

## 1. Executive Summary

Rank-Arena is a well-structured leaderboard application with good separation of concerns, consistently parameterized SQL queries, and a thoughtful CSRF defense. However, two issues require immediate attention before production exposure: unescaped user input injected into server-side SVG generation creates a denial-of-service vector (and potential libvips exploit surface), and wildcard CORS allows any origin to make credentialed requests. Several high-priority issues — unenforced WordPress identity verification, unlimited admin brute-force, missing request-body size limits — are straightforward to fix but carry meaningful risk if left open.

---

## 2. Critical Issues (P0)

### C1 — Unescaped User Input Injected into SVG (DoS + libvips exploit surface)
**File:** `server/routes/share.js:61–135`

`req.query.c`, `req.query.trail`, and `req.query.d` are inserted into a raw SVG string that is then rendered to PNG by `sharp`:

```js
// share.js:65
const statCategory = req.query.c;
const statLabel = STAT_LABELS[statCategory] || statCategory;  // raw fallback

// share.js:111  — injected verbatim into <text> element
  <text ...>${statLabel}</text>

// share.js:61, 124 — trail iterated per character, no length limit
const trail = req.query.trail;
for (let i = 0; i < trail.length; i++) { ... }   // O(n) SVG elements

// share.js:135
const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();
```

**Why it matters:**
- An attacker sends `?trail=<10 MB string>` — the server generates a 10 MB SVG and asks `sharp`/libvips to rasterize it; this can exhaust CPU/memory per request with no concurrency guard.
- `statLabel` with `<`, `>`, `&`, `"` breaks SVG XML structure; malformed SVG is undefined behavior in libvips (has historically had CVEs for malformed SVG inputs).
- `req.query.d` (date string) is parsed to `Date` and formatted — currently safe because `Date.toLocaleDateString` always returns a string — but is still unbounded.

**Suggested fix:**
```js
// Allowlist statCategory strictly — never fall back to raw input
const statCategory = STAT_LABELS[req.query.c] ? req.query.c : 'metacritic';
const statLabel = STAT_LABELS[statCategory];

// Cap trail length and allowlist characters
const trail = String(req.query.trail || '').slice(0, 20).replace(/[^WLwl]/g, '');

// Escape any string before SVG insertion
function svgEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

### C2 — Wildcard CORS on All Routes
**File:** `server/index.js:13`

```js
app.use(cors());   // no options — equivalent to Access-Control-Allow-Origin: *
```

All routes, including mutation endpoints (`/api/challenge/submit`, `/api/endless/submit`, admin routes), accept requests from any origin. Combined with cookie-based or token-based auth, this means any malicious website can make cross-origin requests to the API on behalf of a logged-in user.

**Why it matters:** CSRF protection via `X-Requested-With` + origin allowlist (`csrf.js`) does exist, but it only applies to routes that use the `csrf` middleware — the CORS header itself broadcasts that the server will respond to any origin, which undermines the defense-in-depth posture and is unnecessary.

**Suggested fix:**
```js
// server/index.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
```

---

## 3. High Priority

### H1 — No HTTP Security Headers
**File:** `server/index.js` (no helmet or equivalent)

The server sets no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Referrer-Policy`. Browsers apply loose defaults.

**Suggested fix:**
```js
import helmet from 'helmet';
app.use(helmet());
// Then tune CSP for your specific asset sources
```

---

### H2 — WordPress Identity Verification Is Optional
**Files:** `server/routes/challenge.js:159–169`, `server/routes/endless.js:99–109`

```js
// challenge.js:159
const wpSecret = process.env.WP_AUTH_SECRET;
if (wpSecret) {
  // HMAC verification
} else {
  // No verification — any wp_user_id is accepted
}
```

If `WP_AUTH_SECRET` is absent from the environment (misconfigured deploy, `.env` not set up), any caller can assert any WordPress user identity by supplying an arbitrary `wp_user_id` in the request body. There is no fail-secure default.

**Suggested fix:** Remove the conditional — require the secret always. If it's absent, refuse WP-authenticated requests:
```js
const wpSecret = process.env.WP_AUTH_SECRET;
if (!wpSecret) {
  return res.status(503).json({ error: 'Server not configured for WordPress auth' });
}
// Always verify HMAC
```

Also document `WP_AUTH_SECRET` in `.env.example` (see M4).

---

### H3 — Unvalidated `wp_user_id` in Leaderboard Routes
**File:** `server/routes/leaderboard.js:25, 54`

```js
// leaderboard.js:25
const userId = req.user?.id || (req.query.wp_user_id ? 'wp_' + req.query.wp_user_id : null);
```

`req.query.wp_user_id` is concatenated without type or format validation. A query string value is always a string, so `wp_user_id=../../../../etc/passwd` becomes `userId = 'wp_/../../../etc/passwd'`. While this is used in a parameterized SQL query (safe from injection), it creates unbounded-length user ID values stored in the database and leaks to clients.

**Suggested fix:**
```js
const rawWpId = req.query.wp_user_id;
if (rawWpId !== undefined && !/^\d+$/.test(rawWpId)) {
  return res.status(400).json({ error: 'Invalid wp_user_id' });
}
const userId = req.user?.id || (rawWpId ? 'wp_' + rawWpId : null);
```

---

### H4 — No Request Body Size Limit
**File:** `server/index.js:14`

```js
app.use(express.json());   // default limit: 100kb — but not explicitly set
```

Express's default JSON body limit is 100 KB, which is reasonable but not explicit. More importantly, `express.urlencoded()` is not configured, and there is no global limit on query string length. The SVG endpoint (C1) accepts unbounded query strings — `?trail=` with megabytes of data — without any middleware interception.

**Suggested fix:**
```js
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
```
And enforce query string length in the share route (covered in C1 fix).

---

### H5 — Admin Rate Limiter Applied After Auth Middleware
**File:** `server/routes/admin.js:14`

```js
router.use(adminAuth);      // line 13 — auth checked first
router.use(adminLimiter);   // line 14 — rate limit only after auth succeeds
```

`adminLimiter` never fires on failed authentication attempts because `adminAuth` rejects them before the limiter runs. An attacker can brute-force the admin password with unlimited requests.

**Suggested fix:** Apply the rate limiter first:
```js
router.use(adminLimiter);
router.use(adminAuth);
```

---

### H6 — Admin Password Compared with `!==` (Timing Attack)
**File:** `server/middleware/adminAuth.js:12`

```js
if (password !== process.env.ADMIN_PASSWORD) {
  return res.status(401)...
}
```

String inequality with `!==` short-circuits on the first differing character, leaking timing information proportional to how many prefix characters match. For secrets, use a constant-time comparison.

**Suggested fix:**
```js
import { timingSafeEqual } from 'crypto';

const provided = Buffer.from(password);
const expected = Buffer.from(process.env.ADMIN_PASSWORD || '');
if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
  return res.status(401)...
}
```

---

## 4. Medium Priority

### M1 — API Key Passed as URL Query Parameter
**File:** `server/scripts/fetchCovers.js:37`

```js
`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=...`
```

API keys in URLs appear in server access logs, browser history, `Referer` headers, and proxy logs. Prefer an `Authorization` header if the API supports it; if not, at minimum ensure your hosting provider's log pipeline scrubs query strings.

---

### M2 — Magic Number for Score Validation
**File:** `server/routes/endless.js:91`

```js
if (score > 500) {
  return res.status(400).json({ error: 'Invalid score' });
}
```

`500` is hardcoded inline with no comment explaining the game logic basis. If the game design changes (more rounds, bonus multipliers), this silent cap will silently reject legitimate high scores.

**Suggested fix:**
```js
// server/config.js or top of endless.js
const ENDLESS_MAX_SCORE = 500;   // 50 rounds × 10 points/round

if (score > ENDLESS_MAX_SCORE) { ... }
```

---

### M3 — In-Memory Challenge Cache Breaks Multi-Process Deployments
**File:** `server/routes/challenge.js:14–15`

```js
let cachedChallenge = null;
let cachedDate = null;
```

Module-level variables cache today's challenge in a single Node.js process. With `cluster`, PM2 workers, or any horizontal scaling, each process has an independent cache — different users may see different challenges from the same day. The fix is to cache in SQLite (already available) or add a `challenge_cache` table.

---

### M4 — Missing Variables in `.env.example`
**File:** `.env.example`

The following variables are used in code but absent from `.env.example`:

| Variable | Used in |
|---|---|
| `WP_AUTH_SECRET` | `challenge.js`, `endless.js` |
| `VITE_SUPABASE_URL` | Supabase client init |
| `VITE_SUPABASE_ANON_KEY` | Supabase client init |
| `SQLITE_PATH` | `server/db/pool.js` |
| `ALLOWED_ORIGIN` | Should be added for C2 CORS fix |

New developers will hit runtime errors without any indication of what's missing.

---

### M5 — PHP Proxy Path Traversal Risk
**File:** `server/api-proxy.php:19`

```php
$path = ltrim($path, '/');
$target = "http://127.0.0.1:3001/api/" . $path;
```

`ltrim` only strips leading slashes — it does not prevent `../` sequences in the middle of the path. A request to `/arena/api/../../admin` would forward to `http://127.0.0.1:3001/admin` (bypassing the `/api/` prefix restriction). While the Express server's route structure limits impact, this is not a robust defense.

**Suggested fix:**
```php
$path = ltrim($path, '/');
// Reject any path containing traversal sequences
if (strpos($path, '..') !== false || strpos($path, './') !== false) {
    http_response_code(400);
    exit('Invalid path');
}
$target = "http://127.0.0.1:3001/api/" . $path;
```

---

## 5. Strengths

- **Parameterized SQL everywhere.** All queries in `server/db/queries.js` use `?` placeholders. The `getGamesWithStat()` function adds an explicit allowlist on top of parameterization — defense in depth.
- **CSRF defense is layered.** `csrf.js` enforces both `X-Requested-With: RankArena` and an origin/referer allowlist. The client (`api.js`) always sends the header. This correctly blocks naive CSRF attacks.
- **HMAC for WordPress identity.** Using `crypto.createHmac('sha256', WP_AUTH_SECRET).update(String(wp_user_id))` is the right approach for cross-system user identity — avoids the complexity of shared session storage. Fix H2 to make it non-optional.
- **Database schema is solid.** `schema.sql` has FK constraints, a `UNIQUE(user_id, challenge_date)` constraint preventing duplicate submissions, WAL mode for concurrent reads, and well-chosen composite indexes.
- **`getGamesWithStat` allowlist.** Explicit column allowlist (`queries.js:34–36`) before dynamic SQL column insertion is exactly the right pattern.
- **Rate limiting on public endpoints.** `express-rate-limit` is applied on leaderboard and submission routes. Fix H5 to extend it to admin auth.
- **Supabase service key stays server-side.** `SUPABASE_SERVICE_KEY` is used only in `server/middleware/auth.js` — never exposed to the client.
- **Clean route/middleware separation.** Auth, CSRF, rate limiting, and DB access are each in dedicated files. Easy to audit and test.

---

## 6. Recommended Next Steps

1. **C1 (SVG injection):** Allowlist `statCategory`, cap `trail` to 20 chars and allowlist `[WLwl]`, add `svgEscape()` for any string inserted into SVG. Deploy immediately.
2. **C2 (CORS):** Set `origin: process.env.ALLOWED_ORIGIN` in `cors()` options. Add `ALLOWED_ORIGIN` to `.env.example`.
3. **H2 (WP auth optional):** Fail-secure if `WP_AUTH_SECRET` is missing. Add to `.env.example`.
4. **H5 (rate limiter order):** Move `router.use(adminLimiter)` above `router.use(adminAuth)`.
5. **H6 (timing-safe comparison):** Use `crypto.timingSafeEqual` for admin password check.
6. **H1 (security headers):** `npm install helmet` and `app.use(helmet())` in `server/index.js`.
7. **H3 (wp_user_id validation):** Validate as integer with `/^\d+$/` before use.
8. **H4 (body size limit):** Explicitly set `{ limit: '50kb' }` on `express.json()`.
9. **M4 (.env.example):** Document all 5 missing variables with example values.
10. **M5 (PHP proxy):** Add `..` traversal check in `api-proxy.php`.
