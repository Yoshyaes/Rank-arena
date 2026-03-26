// In production, API goes through PHP proxy at /arena/api-proxy.php
// In development, Vite proxies /arena/api to localhost:3001
const IS_PROD = import.meta.env.PROD;

function buildUrl(apiPath) {
  if (IS_PROD) {
    // Route through PHP proxy: /arena/api-proxy.php?path=challenge/today
    const cleanPath = apiPath.replace(/^\//, '');
    return `/arena/api-proxy.php?path=${encodeURIComponent(cleanPath)}`;
  }
  return `/arena/api${apiPath}`;
}

async function request(apiPath, options = {}, retries = 0) {
  const url = buildUrl(apiPath);

  // For GET requests with query params through the proxy, append them
  let finalUrl = url;
  if (IS_PROD && apiPath.includes('?')) {
    const [path, query] = apiPath.split('?');
    finalUrl = `/arena/api-proxy.php?path=${encodeURIComponent(path.replace(/^\//, ''))}&${query}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(finalUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'RankArena',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      // Retry on server errors (5xx) and rate limits (429), up to 2 retries for GET
      if (retries < 2 && !options.method && (res.status >= 500 || res.status === 429)) {
        const delay = (retries + 1) * 1000;
        await new Promise(r => setTimeout(r, delay));
        return request(apiPath, options, retries + 1);
      }
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
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
  const params = excludeIds.length ? `?exclude=${excludeIds.join(',')}` : '';
  return request(`/endless/pair${params}`);
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
