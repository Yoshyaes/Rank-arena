import { useState, useEffect } from 'react';
import ShareCard from './ShareCard';

function getCommentary(score, totalRounds, mode) {
  if (mode === 'endless') {
    if (score === 0) return 'Tough break!';
    if (score <= 3) return 'Warming up!';
    if (score <= 7) return 'Solid run!';
    if (score <= 12) return 'Impressive streak!';
    return 'Absolute legend!';
  }
  const pct = totalRounds > 0 ? score / totalRounds : 0;
  if (pct === 1) return 'FLAWLESS! You\'re a gaming encyclopedia!';
  if (pct >= 0.9) return 'So close to perfect!';
  if (pct >= 0.7) return 'Impressive knowledge!';
  if (pct >= 0.5) return 'Not bad \u2014 can you do better?';
  if (pct >= 0.2) return 'Keep playing, you\'ll improve!';
  return 'Better luck next time!';
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
      setShowEmojis(false);
      const t = setTimeout(() => setShowEmojis(true), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  const isPerfect = score === totalRounds;
  const allCorrect = results.every(r => r.correct);
  const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
  const commentary = getCommentary(score, totalRounds, mode);

  function getScoreColor() {
    if (isPerfect) return 'text-accent-gold';
    if (percentage >= 70) return 'text-accent-win';
    if (percentage >= 40) return 'text-accent-blue';
    return 'text-text-primary';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-auto bg-bg-surface rounded-t-3xl sm:rounded-3xl border border-border overflow-hidden animate-slide-up">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-gold" />

        <div className="p-6">
          {/* Heading */}
          <h2 className="text-center font-grotesk text-xl font-bold text-text-primary mb-1">
            {mode === 'challenge'
              ? (isPerfect ? '\u{1F3C6} Perfect Score!' : allCorrect ? 'Daily Challenge Complete' : 'Challenge Ended')
              : (score > 10 ? '\u{1F525} What a Run!' : 'Game Over')
            }
          </h2>

          {mode === 'challenge' && (
            <p className="text-center text-text-secondary text-sm mb-4">
              Daily #{challengeNumber} &middot; {statLabel}
            </p>
          )}

          {/* Score with ring */}
          <div className="flex justify-center mb-3">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={isPerfect ? 'var(--accent-gold)' : percentage >= 70 ? 'var(--accent-win)' : percentage >= 40 ? 'var(--accent-blue)' : 'var(--accent-lose)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * percentage) / 100}
                  style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
                />
              </svg>
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${isPerfect ? 'animate-glow' : ''}`}>
                <span className={`font-grotesk text-4xl font-extrabold leading-none ${getScoreColor()}`}>
                  {score}
                </span>
                {mode === 'challenge' && (
                  <span className="text-text-secondary text-sm font-medium">/ {totalRounds}</span>
                )}
              </div>
            </div>
          </div>

          {/* Commentary */}
          <p className="text-center text-text-secondary text-sm font-medium mb-4">
            {commentary}
          </p>

          {/* Emoji trail with stagger animation */}
          <div className="flex gap-1.5 justify-center flex-wrap mb-5">
            {results.map((r, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-md flex items-center justify-center
                  ${r.correct ? 'bg-accent-win/20 border border-accent-win/30' : 'bg-accent-lose/20 border border-accent-lose/30'}`}
                style={{
                  opacity: showEmojis ? 1 : 0,
                  transform: showEmojis ? 'scale(1)' : 'scale(0)',
                  transition: `all 200ms ease-out ${i * 50}ms`,
                }}
              >
                {r.correct ? (
                  <svg className="w-3.5 h-3.5 text-accent-win" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-accent-lose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Streak */}
          {streak && streak.current > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-5 py-2 px-4 rounded-full bg-bg-card border border-border mx-auto w-fit">
              <span className="text-base">{'\u{1F525}'}</span>
              <span>{streak.current} day streak</span>
              <span className="text-border">&middot;</span>
              <span>Best: {streak.longest}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {mode === 'challenge' && (
              <button
                onClick={() => setShowShare(true)}
                className="btn-text w-full py-3.5 rounded-full bg-accent-gold text-black
                  hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Results
              </button>
            )}

            {onPlayEndless && mode === 'challenge' && (
              <button
                onClick={onPlayEndless}
                className="btn-text w-full py-3.5 rounded-full bg-accent-purple text-white
                  hover:brightness-110 transition-all"
              >
                Play Endless Mode &rarr;
              </button>
            )}

            {onPlayAgain && mode === 'endless' && (
              <button
                onClick={onPlayAgain}
                className="btn-text w-full py-3.5 rounded-full bg-accent-blue text-white
                  hover:brightness-110 transition-all"
              >
                Play Again
              </button>
            )}

            {onViewLeaderboard && (
              <button
                onClick={onViewLeaderboard}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                View Leaderboard
              </button>
            )}
          </div>
        </div>

        {/* Share overlay */}
        {showShare && (
          <ShareCard
            score={score}
            totalRounds={totalRounds}
            results={results}
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
