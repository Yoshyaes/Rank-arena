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

async function request(apiPath, options = {}) {
  const url = buildUrl(apiPath);

  // For GET requests with query params through the proxy, append them
  let finalUrl = url;
  if (IS_PROD && apiPath.includes('?')) {
    const [path, query] = apiPath.split('?');
    finalUrl = `/arena/api-proxy.php?path=${encodeURIComponent(path.replace(/^\//, ''))}&${query}`;
  }

  const res = await fetch(finalUrl, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
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

export function fetchDailyLeaderboard(date) {
  const params = date ? `?date=${date}` : '';
  return request(`/leaderboard/daily${params}`);
}

export function fetchEndlessLeaderboard() {
  return request('/leaderboard/endless');
}

export function fetchUserStats() {
  return request('/user/stats');
}
