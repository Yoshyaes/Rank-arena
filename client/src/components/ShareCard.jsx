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
  statCategory,
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

  // Build trail string for URL (1 = correct, 0 = wrong)
  const trailStr = results.map(r => r.correct ? '1' : '0').join('');
  const emojiTrail = results.map(r => r.correct ? '\u2705' : '\u274C').join('');

  // Share URL with OG image unfurling
  const shareParams = new URLSearchParams({
    s: score, t: totalRounds, n: challengeNumber,
    c: statCategory || 'metacritic', trail: trailStr,
    streak: streak?.current || 0, d: date,
  });
  const shareUrl = `https://twoaveragegamers.com/arena/share.php?${shareParams}`;

  // Share text includes both the visual text and the URL
  const shareText = [
    `Rank Arena Daily #${challengeNumber} \u2014 ${formatDate(date)}`,
    `${emoji} ${statLabel}`,
    '',
    `${emojiTrail} \u2014 ${score}/${totalRounds}`,
    '',
    streak && streak.current > 0
      ? `\u{1F525} ${streak.current} day streak`
      : '',
    shareUrl,
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
        await navigator.share({ text: shareText, url: shareUrl });
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

  // Image preview URL (direct to Node.js)
  const imageParams = new URLSearchParams({
    s: score, t: totalRounds, n: challengeNumber,
    c: statCategory || 'metacritic', trail: trailStr,
    streak: streak?.current || 0, d: date,
  });
  const host = window.location.hostname;
  const imagePreviewUrl = `${window.location.protocol}//${host}:3001/api/share/image?${imageParams}`;

  return (
    <div className="absolute inset-0 bg-bg-surface rounded-3xl flex flex-col animate-card-pop overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-accent-blue to-accent-purple px-6 py-3">
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

      {/* Image preview */}
      <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full max-w-[360px] rounded-xl overflow-hidden border border-border shadow-lg">
          <img
            src={imagePreviewUrl}
            alt="Share card preview"
            className="w-full h-auto"
            loading="eager"
          />
        </div>
        <p className="text-text-secondary/60 text-xs mt-2">This is what others will see when you share</p>
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
