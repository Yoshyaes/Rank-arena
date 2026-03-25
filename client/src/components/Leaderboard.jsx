import { useState, useEffect } from 'react';
import { fetchDailyLeaderboard, fetchEndlessLeaderboard } from '../lib/api';

export default function Leaderboard() {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [tab]);

  async function loadLeaderboard() {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'daily') {
        const res = await fetchDailyLeaderboard();
        setData(res.leaderboard || []);
      } else {
        const res = await fetchEndlessLeaderboard();
        setData(res.leaderboard || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card rounded-full p-1 mb-6">
        <button
          onClick={() => setTab('daily')}
          className={`flex-1 btn-text text-sm py-2.5 rounded-full transition-all ${
            tab === 'daily' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setTab('endless')}
          className={`flex-1 btn-text text-sm py-2.5 rounded-full transition-all ${
            tab === 'endless' ? 'bg-accent-purple text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Endless
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-text-secondary py-12 animate-pulse">Loading...</div>
      ) : error ? (
        <div className="text-center text-accent-lose py-12">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-center text-text-secondary py-12">
          <p className="mb-2">No scores yet</p>
          <p className="text-sm">Be the first to play today's challenge!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                i < 3 ? 'bg-bg-card border border-border' : 'bg-bg-card/50'
              }`}
            >
              {/* Rank */}
              <span className={`font-grotesk font-bold text-lg w-8 text-center ${
                i === 0 ? 'text-accent-gold' : i === 1 ? 'text-text-secondary' : i === 2 ? 'text-accent-gold/60' : 'text-text-secondary'
              }`}>
                {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : entry.rank}
              </span>

              {/* Name */}
              <span className="flex-1 text-text-primary font-medium truncate">
                {entry.displayName}
              </span>

              {/* Score */}
              <span className="font-grotesk font-bold text-lg text-accent-blue">
                {entry.score}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA for guests */}
      <div className="text-center mt-8 text-text-secondary text-sm">
        Sign in to appear on the leaderboard
      </div>
    </div>
  );
}
