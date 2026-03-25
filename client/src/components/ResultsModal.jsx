import { useState } from 'react';
import ShareCard from './ShareCard';

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

  if (!visible) return null;

  const isPerfect = score === totalRounds;
  const allCorrect = results.every(r => r.correct);

  // Emoji trail
  const emojiTrail = results.map(r => r.correct ? '\u2705' : '\u274C').join('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-auto bg-bg-surface rounded-t-3xl sm:rounded-3xl border border-border p-6 animate-slide-up">
        {/* Heading */}
        <h2 className="text-center font-grotesk text-xl font-bold text-text-primary mb-1">
          {mode === 'challenge'
            ? (isPerfect ? 'Perfect Score!' : allCorrect ? 'Daily Challenge Complete' : 'Challenge Ended')
            : 'Game Over'
          }
        </h2>

        {mode === 'challenge' && (
          <p className="text-center text-text-secondary text-sm mb-6">
            Daily #{challengeNumber} &middot; {statLabel}
          </p>
        )}

        {/* Score */}
        <div className="text-center mb-4">
          <span className={`font-grotesk text-[56px] font-extrabold leading-none ${isPerfect ? 'text-accent-gold' : 'text-text-primary'}`}>
            {score}
            {mode === 'challenge' && (
              <span className="text-text-secondary text-3xl"> / {totalRounds}</span>
            )}
          </span>
        </div>

        {/* Emoji trail */}
        <div className="text-center text-2xl mb-6 tracking-widest">
          {emojiTrail}
        </div>

        {/* Streak (if available) */}
        {streak && streak.current > 0 && (
          <div className="text-center text-text-secondary text-sm mb-6">
            {'\u{1F525}'} {streak.current} day streak &middot; Best: {streak.longest} days
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {mode === 'challenge' && (
            <button
              onClick={() => setShowShare(true)}
              className="btn-text w-full py-3.5 rounded-full bg-accent-gold text-black
                hover:brightness-110 transition-all"
            >
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
