/**
 * Rank Arena API client.
 * Production: hits WordPress REST at /wp-json/rank-arena/v1/* (cookie auth + nonce)
 * Dev: same endpoints, optionally proxied via Vite to a local WP install.
 *
 * Reads `window.rankArena` injected by the [rank_arena] shortcode:
 *   { apiUrl, nonce, siteUrl, userId, isAdmin }
 * If absent, falls back to `/wp-json/rank-arena/v1` (works when served from same origin).
 */

const ctx = typeof window !== 'undefined' ? window.rankArena : null;
const API_BASE = ctx?.apiUrl || '/wp-json/rank-arena/v1';
const NONCE    = ctx?.nonce  || '';
export const SITE_URL = ctx?.siteUrl || '/';
export const VIEWER_ID = ctx?.userId || 0;

async function request(path, options = {}, retries = 0) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'RankArena',
        ...(NONCE ? { 'X-WP-Nonce': NONCE } : {}),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      if (retries < 2 && !options.method && (res.status >= 500 || res.status === 429)) {
        await new Promise(r => setTimeout(r, (retries + 1) * 1000));
        return request(path, options, retries + 1);
      }
      const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — please try again', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function isLoggedIn() {
  return !!VIEWER_ID;
}

export function getLoginUrl() {
  const root = SITE_URL.replace(/\/$/, '');
  const here = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : root);
  return `${root}/wp-login.php?redirect_to=${here}`;
}

export function fetchMe() {
  return request('/me');
}

export function fetchTodayChallenge() {
  return request('/challenge/today');
}

export function submitAnswer(round, choice, date) {
  return request('/challenge/submit', {
    method: 'POST',
    body: JSON.stringify({ round, choice, date }),
  });
}

export function submitChallengeResult(date, score) {
  return request('/challenge/result', {
    method: 'POST',
    body: JSON.stringify({ date, score }),
  });
}

export function fetchEndlessPair(excludeIds = []) {
  const qs = excludeIds.length ? `?exclude=${excludeIds.join(',')}` : '';
  return request(`/endless/pair${qs}`);
}

export function submitEndlessAnswer(gameAId, gameBId, statCategory, choice) {
  return request('/endless/score', {
    method: 'POST',
    body: JSON.stringify({ game_a_id: gameAId, game_b_id: gameBId, stat_category: statCategory, choice }),
  });
}

export function submitEndlessResult(score) {
  return request('/endless/result', {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export function fetchDailyLeaderboard(date, offset = 0, limit = 20) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (offset > 0) params.set('offset', String(offset));
  if (limit !== 20) params.set('limit', String(limit));
  const qs = params.toString();
  return request(`/leaderboard/daily${qs ? '?' + qs : ''}`);
}

export function fetchEndlessLeaderboard(offset = 0, limit = 20) {
  const params = new URLSearchParams();
  if (offset > 0) params.set('offset', String(offset));
  if (limit !== 20) params.set('limit', String(limit));
  const qs = params.toString();
  return request(`/leaderboard/endless${qs ? '?' + qs : ''}`);
}

export function fetchUserStats() {
  return request('/user/stats');
}

/** Server-rendered share image; produces a URL the user can share or that <img> can render. */
export function shareImageUrl({ score, total, number, statCategory, trail, streak, date }) {
  const params = new URLSearchParams({
    s: String(score), t: String(total), n: String(number),
    c: statCategory, trail, streak: String(streak), d: date,
  });
  return `${API_BASE}/share/image?${params.toString()}`;
}
