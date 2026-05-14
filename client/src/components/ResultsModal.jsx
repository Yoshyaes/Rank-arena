import { useState, useEffect } from 'react';
import ShareCard from './ShareCard';

function getCommentary(score, totalRounds, mode) {
  if (mode === 'endless') {
    if (score === 0) return 'Tough break.';
    if (score <= 3) return 'Warming up.';
    if (score <= 7) return 'Solid run.';
    if (score <= 12) return 'Impressive streak.';
    return 'Absolute legend.';
  }
  const pct = totalRounds > 0 ? score / totalRounds : 0;
  if (pct === 1)   return 'FLAWLESS. Gaming encyclopedia.';
  if (pct >= 0.9)  return 'So close to perfect.';
  if (pct >= 0.7)  return 'Impressive knowledge.';
  if (pct >= 0.5)  return 'Not bad. Can you do better?';
  if (pct >= 0.2)  return 'Keep playing, you will improve.';
  return 'Better luck next time.';
}

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

export default function ResultsModal({
  visible,
  score,
  totalRounds,
  results,
  statCategory,
  statLabel,
  challengeNumber,
  date,
  streak,
  mode = 'challenge',
  onPlayEndless,
  onPlayAgain,
  onViewLeaderboard,
}) {
  const [showShare, setShowShare] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    if (visible) {
      vibrate(score === totalRounds && totalRounds > 0 ? [40, 40, 80] : 30);
      setShowEmojis(false);
      const t = setTimeout(() => setShowEmojis(true), 280);
      return () => clearTimeout(t);
    }
  }, [visible, score, totalRounds]);

  if (!visible) return null;

  const isPerfect  = score === totalRounds && totalRounds > 0;
  const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
  const commentary = getCommentary(score, totalRounds, mode);

  const ringColor = isPerfect
    ? 'var(--tag-status-gold)'
    : percentage >= 70
    ? 'var(--tag-status-success)'
    : percentage >= 40
    ? 'var(--tag-accent-cyan)'
    : 'var(--tag-status-error)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Game results"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(11, 15, 26, 0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      />

      <div
        className="tag-anim-slide-up relative w-full sm:max-w-md mx-0 sm:mx-4 overflow-hidden"
        style={{
          background: 'var(--tag-surface-midnight)',
          border: '1px solid var(--tag-border-hairline)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          borderBottomLeftRadius: '0',
          borderBottomRightRadius: '0',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Top accent bar (signature TAG cyan→purple) */}
        <div className="h-1" style={{ background: 'var(--tag-gradient-border)', backgroundSize: '200% 200%', animation: 'tag-border-flow 6s ease infinite' }} />

        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Drag handle */}
          <div className="sm:hidden mx-auto h-1 w-12 rounded-full mb-4" style={{ background: 'var(--tag-border-input)' }} />

          {/* Heading */}
          <span className="block text-center tag-pixel-label" style={{ marginBottom: '0.5rem' }}>
            {mode === 'challenge' ? 'DAILY RESULT' : 'ENDLESS RESULT'}
          </span>
          <h2 className="tag-h1 text-center mb-1" style={{ fontFamily: 'var(--tag-font-display)' }}>
            {mode === 'challenge'
              ? (isPerfect ? 'Flawless' : percentage >= 70 ? 'Solid Run' : 'Done')
              : (score > 10 ? 'Hot Streak' : 'Game Over')}
          </h2>

          {mode === 'challenge' && (
            <p className="text-center mb-4" style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem' }}>
              Daily #{challengeNumber} · {statLabel}
            </p>
          )}

          {/* Score with ring */}
          <div className="flex justify-center mb-3">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--tag-border-input)" strokeWidth="5" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={ringColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * percentage) / 100}
                  style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
                />
              </svg>
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${isPerfect ? 'tag-anim-glow' : ''}`}>
                <span
                  style={{
                    fontFamily: 'var(--tag-font-display)',
                    fontSize: '2.75rem',
                    color: ringColor,
                    lineHeight: 1,
                    textShadow: isPerfect ? '0 0 18px rgba(255, 215, 0, 0.4)' : 'none',
                  }}
                >
                  {score}
                </span>
                {mode === 'challenge' && (
                  <span style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                    / {totalRounds}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Commentary */}
          <p className="text-center mb-4" style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            {commentary}
          </p>

          {/* Trail */}
          <div className="flex gap-1.5 justify-center flex-wrap mb-5">
            {results.map((r, i) => (
              <div
                key={r.round ?? i}
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{
                  background: r.correct ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.20)',
                  border: r.correct
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                  opacity: showEmojis ? 1 : 0,
                  transform: showEmojis ? 'scale(1)' : 'scale(0)',
                  transition: `all 220ms ease-out ${i * 50}ms`,
                }}
              >
                {r.correct ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="var(--tag-status-success)" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="var(--tag-status-error)" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Streak */}
          {streak && streak.current > 0 && (
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="tag-badge tag-badge-gold" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                <span aria-hidden="true">🔥</span>
                <span>{streak.current} day streak</span>
                <span style={{ color: 'var(--tag-text-muted)' }}>·</span>
                <span>Best {streak.longest}</span>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {mode === 'challenge' && (
              <button
                onClick={() => { vibrate(15); setShowShare(true); }}
                className="tag-btn-primary tag-btn-xl w-full"
              >
                Share Results
              </button>
            )}

            {onPlayEndless && mode === 'challenge' && (
              <button
                onClick={onPlayEndless}
                className="tag-btn-ghost tag-btn-xl w-full"
                style={{ background: 'var(--tag-accent-purple)', color: 'var(--tag-surface-void)', borderColor: 'var(--tag-accent-purple)' }}
              >
                Play Endless Mode →
              </button>
            )}

            {onPlayAgain && mode === 'endless' && (
              <button
                onClick={onPlayAgain}
                className="tag-btn-primary tag-btn-xl w-full"
              >
                Play Again
              </button>
            )}

            {onViewLeaderboard && (
              <button
                onClick={onViewLeaderboard}
                className="tag-btn-ghost"
                style={{ background: 'transparent', border: 'none' }}
              >
                View Leaderboard
              </button>
            )}
          </div>
        </div>

        {/* Share overlay (full sheet) */}
        {showShare && (
          <ShareCard
            score={score}
            totalRounds={totalRounds}
            results={results}
            statCategory={statCategory}
            statLabel={statLabel}
            challengeNumber={challengeNumber}
            date={date}
            streak={streak}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    </div>
  );
}
