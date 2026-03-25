import { useState } from 'react';

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

  const emoji = STAT_EMOJI[statLabel] || '\u{1F3AE}';
  const emojiTrail = results.map(r => r.correct ? '\u2705' : '\u274C').join('');

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  const shareText = [
    `Rank Arena Daily #${challengeNumber} \u2014 ${formatDate(date)}`,
    `${emoji} ${statLabel}`,
    '',
    `${emojiTrail} \u2014 ${score}/${totalRounds}`,
    '',
    streak && streak.longest > 0
      ? `Best: ${streak.longest}/${totalRounds} | \u{1F525} ${streak.current} day streak`
      : '',
    'Beat me: twaveragegamers.com/arena',
  ].filter(Boolean).join('\n');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
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

  return (
    <div className="absolute inset-0 bg-bg-surface rounded-3xl p-6 flex flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="text-center font-semibold text-text-primary mb-4">Share Your Score</h3>

      <div className="flex-1 bg-bg-card rounded-xl p-4 font-mono text-sm text-text-primary whitespace-pre-wrap mb-4">
        {shareText}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 btn-text py-3 rounded-full bg-accent-blue text-white hover:brightness-110 transition-all"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        {navigator.share && (
          <button
            onClick={handleShare}
            className="flex-1 btn-text py-3 rounded-full bg-accent-gold text-black hover:brightness-110 transition-all"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
