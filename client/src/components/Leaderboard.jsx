import { useState, useEffect, useCallback } from 'react';
import { fetchDailyLeaderboard, fetchEndlessLeaderboard } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [userRank, setUserRank] = useState(null);

  const loadLeaderboard = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setData([]);
    }
    setError(null);
    try {
      const offset = append ? data.length : 0;
      let res;
      if (tab === 'daily') {
        res = await fetchDailyLeaderboard(null, offset, PAGE_SIZE);
      } else {
        res = await fetchEndlessLeaderboard(offset, PAGE_SIZE);
      }
      const entries = res.leaderboard || [];
      setData(prev => append ? [...prev, ...entries] : entries);
      setHasMore(res.hasMore || false);
      setTotal(res.total || 0);
      setUserRank(res.userRank || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, data.length]);

  useEffect(() => {
    loadLeaderboard(false);
  }, [tab]);

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
        <div className="text-center py-12">
          <p className="text-accent-lose mb-3">{error}</p>
          <button
            onClick={() => loadLeaderboard(false)}
            className="text-sm text-accent-blue hover:text-text-primary transition-colors"
          >
            Try again
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-text-secondary py-12">
          <p className="mb-2">No scores yet</p>
          <p className="text-sm">Be the first to play today's challenge!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.map((entry, i) => (
              <div
                key={`${entry.displayName}-${entry.score}-${entry.rank}`}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                  entry.rank <= 3 ? 'bg-bg-card border border-border' : 'bg-bg-card/50'
                }`}
              >
                {/* Rank */}
                <span className={`font-grotesk font-bold text-lg w-8 text-center ${
                  entry.rank === 1 ? 'text-accent-gold' : entry.rank === 2 ? 'text-text-secondary' : entry.rank === 3 ? 'text-accent-gold/60' : 'text-text-secondary'
                }`}>
                  {entry.rank === 1 ? '\u{1F947}' : entry.rank === 2 ? '\u{1F948}' : entry.rank === 3 ? '\u{1F949}' : entry.rank}
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

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={() => loadLeaderboard(true)}
                disabled={loadingMore}
                className="text-sm text-accent-blue hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : `Show more (${data.length} of ${total})`}
              </button>
            </div>
          )}

          {/* User's own rank */}
          {userRank && !data.some(e => e.rank === userRank.rank) && (
            <div className="mt-6 flex items-center gap-4 px-4 py-3 rounded-xl bg-accent-blue/10 border border-accent-blue/30">
              <span className="font-grotesk font-bold text-lg w-8 text-center text-accent-blue">
                #{userRank.rank}
              </span>
              <span className="flex-1 text-text-primary font-medium truncate">
                You
              </span>
              <span className="font-grotesk font-bold text-lg text-accent-blue">
                {userRank.score}
              </span>
            </div>
          )}
        </>
      )}

      {/* CTA for guests */}
      {!user && (
        <div className="text-center mt-8 text-text-secondary text-sm">
          <a href="/wp-login.php?redirect_to=/arena/leaderboard" className="text-accent-blue hover:text-text-primary transition-colors">
            Sign in
          </a>
          {' '}to appear on the leaderboard
        </div>
      )}
    </div>
  );
}
