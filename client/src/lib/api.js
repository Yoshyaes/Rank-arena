// In production, API is served from the same origin on port 3001
// In development, Vite proxies /arena/api to localhost:3001
const API_BASE = import.meta.env.PROD
  ? (window.location.protocol + '//' + window.location.hostname + ':3001/api')
  : '/arena/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
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
