import { useState, useEffect } from 'react';

const STAT_EMOJI = {
  'Metacritic Score': '\u{1F4CA}',
  'Total Sales': '\u{1F4B0}',
  'Peak Steam Players': '\u{1F3AE}',
  'Avg Playtime': '\u23F1\uFE0F',
  'User Score': '\u2B50',
};

export default function ShareCard({
  score,
  totalRounds,
  results,
  statLabel,
  challengeNumber,
  date,
  streak,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowEmojis(true), 200);
    return () => clearTimeout(t);
  }, []);

  const emoji = STAT_EMOJI[statLabel] || '\u{1F3AE}';
  const isPerfect = score === totalRounds;
  const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  // Share text stays clean for clipboard/social
  const emojiTrail = results.map(r => r.correct ? '\u2705' : '\u274C').join('');
  const shareText = [
    `Rank Arena Daily #${challengeNumber} \u2014 ${formatDate(date)}`,
    `${emoji} ${statLabel}`,
    '',
    `${emojiTrail} \u2014 ${score}/${totalRounds}`,
    '',
    streak && streak.current > 0
      ? `\u{1F525} ${streak.current} day streak`
      : '',
    'Beat me: twoaveragegamers.com/arena',
  ].filter(Boolean).join('\n');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  function getScoreColor() {
    if (isPerfect) return 'text-accent-gold';
    if (percentage >= 70) return 'text-accent-win';
    if (percentage >= 40) return 'text-accent-blue';
    return 'text-accent-lose';
  }

  return (
    <div className="absolute inset-0 bg-bg-surface rounded-3xl flex flex-col animate-card-pop overflow-hidden">
      {/* Gradient header */}
      <div className="relative bg-gradient-to-r from-accent-blue to-accent-purple px-6 py-4">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className="font-grotesk text-lg font-bold text-accent-gold tracking-wide">RANK ARENA</h3>
          <p className="text-white/80 text-xs mt-0.5">
            Daily #{challengeNumber} &middot; {formatDate(date)}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 px-6 py-5 flex flex-col items-center">
        {/* Stat category badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card border border-border text-sm mb-4">
          <span>{emoji}</span>
          <span className="text-text-secondary font-medium">{statLabel}</span>
        </div>

        {/* Score ring */}
        <div className="relative w-28 h-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
            {/* Score ring */}
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={isPerfect ? 'var(--accent-gold)' : percentage >= 70 ? 'var(--accent-win)' : percentage >= 40 ? 'var(--accent-blue)' : 'var(--accent-lose)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * percentage) / 100}
              style={{ animation: 'ring-fill 800ms ease-out forwards', transition: 'stroke-dashoffset 800ms ease-out' }}
            />
          </svg>
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${isPerfect ? 'animate-glow' : ''}`}>
            <span className={`font-grotesk text-3xl font-extrabold ${getScoreColor()}`}>
              {score}/{totalRounds}
            </span>
          </div>
        </div>

        {/* Emoji trail */}
        <div className="flex gap-1.5 mb-4 flex-wrap justify-center">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                ${r.correct ? 'bg-accent-win/20 border border-accent-win/40' : 'bg-accent-lose/20 border border-accent-lose/40'}`}
              style={{
                opacity: showEmojis ? 1 : 0,
                transform: showEmojis ? 'scale(1)' : 'scale(0)',
                transition: `all 200ms ease-out ${i * 60}ms`,
              }}
            >
              {r.correct ? (
                <svg className="w-4 h-4 text-accent-win" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-accent-lose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Streak */}
        {streak && streak.current > 0 && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <span className="text-lg">{'\u{1F525}'}</span>
            <span>{streak.current} day streak</span>
          </div>
        )}

        {/* Perfect score sparkles */}
        {isPerfect && (
          <p className="text-accent-gold text-sm font-bold animate-glow">{'\u2728'} FLAWLESS {'\u2728'}</p>
        )}

        {/* Branded footer */}
        <p className="text-text-secondary/50 text-[10px] mt-auto pt-2">twoaveragegamers.com/arena</p>
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          onClick={handleCopy}
          className={`flex-1 btn-text py-3.5 rounded-full flex items-center justify-center gap-2 transition-all
            ${copied ? 'bg-accent-win text-white' : 'bg-accent-blue text-white hover:brightness-110'}`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              COPIED!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              COPY
            </>
          )}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleShare}
            className="flex-1 btn-text py-3.5 rounded-full bg-accent-gold text-black hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            SHARE
          </button>
        )}
      </div>
    </div>
  );
}
