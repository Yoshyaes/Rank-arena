import { useState, useEffect, useCallback } from 'react';
import { fetchDailyLeaderboard, fetchEndlessLeaderboard, getLoginUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

const MEDALS = ['🥇', '🥈', '🥉'];

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
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (currentTab, offset = 0) => {
    if (currentTab === 'daily') return fetchDailyLeaderboard(null, offset, PAGE_SIZE);
    return fetchEndlessLeaderboard(offset, PAGE_SIZE);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData([]);
    setError(null);
    fetchData(tab)
      .then(res => {
        if (cancelled) return;
        setData(res.leaderboard || []);
        setHasMore(!!res.hasMore);
        setTotal(res.total || 0);
        setUserRank(res.userRank || null);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, fetchData, retryCount]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetchData(tab, data.length);
      const entries = res.leaderboard || [];
      setData(prev => [...prev, ...entries]);
      setHasMore(!!res.hasMore);
      setTotal(res.total || 0);
      setUserRank(res.userRank || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [tab, data.length, fetchData]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Tabs */}
      <div
        className="flex gap-1 p-1 mb-6"
        style={{
          background: 'var(--tag-surface-midnight)',
          borderRadius: 'var(--tag-radius-pill)',
          border: '1px solid var(--tag-border-hairline)',
        }}
      >
        {[
          { id: 'daily', label: 'Daily' },
          { id: 'endless', label: 'Endless' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 transition-colors"
            style={{
              borderRadius: 'var(--tag-radius-pill)',
              fontFamily: 'var(--tag-font-body)',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              background: tab === t.id ? 'var(--tag-accent-cyan)' : 'transparent',
              color: tab === t.id ? 'var(--tag-surface-void)' : 'var(--tag-text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 tag-pixel-label">LOADING…</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="mb-3" style={{ color: 'var(--tag-status-error)' }}>{error}</p>
          <button onClick={retry} className="tag-btn-ghost">Try again</button>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--tag-text-secondary)' }}>
          <p className="mb-2">No scores yet.</p>
          <p className="text-sm">Be the first to play today's challenge.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.map((entry) => (
              <div
                key={`${entry.userId || entry.displayName}-${entry.score}-${entry.rank}`}
                className="tag-card-flat flex items-center gap-4 px-4 py-3"
              >
                <span
                  className="w-9 text-center"
                  style={{
                    fontFamily: 'var(--tag-font-display)',
                    fontSize: entry.rank <= 3 ? '1.5rem' : '1.125rem',
                    color: entry.rank === 1 ? 'var(--tag-status-gold)' : 'var(--tag-text-secondary)',
                  }}
                >
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                </span>
                <span className="flex-1 truncate" style={{ color: 'var(--tag-text-primary)', fontWeight: 600 }}>
                  {entry.displayName}
                </span>
                <span style={{ fontFamily: 'var(--tag-font-display)', fontSize: '1.125rem', color: 'var(--tag-accent-cyan)' }}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="tag-btn-ghost"
              >
                {loadingMore ? 'Loading…' : `Show more (${data.length} of ${total})`}
              </button>
            </div>
          )}

          {userRank && !data.some(e => e.rank === userRank.rank) && (
            <div
              className="mt-6 flex items-center gap-4 px-4 py-3"
              style={{
                background: 'rgba(34, 197, 212, 0.10)',
                border: '1px solid rgba(34, 197, 212, 0.3)',
                borderRadius: 'var(--tag-radius-md)',
              }}
            >
              <span
                className="w-9 text-center"
                style={{ fontFamily: 'var(--tag-font-display)', fontSize: '1.125rem', color: 'var(--tag-accent-cyan)' }}
              >
                #{userRank.rank}
              </span>
              <span className="flex-1 truncate" style={{ color: 'var(--tag-text-primary)', fontWeight: 600 }}>You</span>
              <span style={{ fontFamily: 'var(--tag-font-display)', fontSize: '1.125rem', color: 'var(--tag-accent-cyan)' }}>
                {userRank.score}
              </span>
            </div>
          )}
        </>
      )}

      {!user && (
        <div className="text-center mt-8" style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem' }}>
          <a href={getLoginUrl()} style={{ color: 'var(--tag-accent-cyan)' }}>Sign in</a>{' '}
          to appear on the leaderboard.
        </div>
      )}
    </div>
  );
}
