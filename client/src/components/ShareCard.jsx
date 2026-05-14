import { useState } from 'react';
import { shareImageUrl, SITE_URL } from '../lib/api';

export default function ShareCard({
  score,
  totalRounds,
  results,
  statCategory,
  statLabel: _statLabel,
  challengeNumber,
  date,
  streak,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  const formatDate = (d) => {
    const dt = new Date((d || '') + 'T00:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  const trailStr = results.map(r => r.correct ? '1' : '0').join('');

  const root = SITE_URL.replace(/\/$/, '');
  const arenaUrl = `${root}/arena/`;
  const imagePreviewUrl = shareImageUrl({
    score, total: totalRounds, number: challengeNumber,
    statCategory: statCategory || 'metacritic',
    trail: trailStr, streak: streak?.current || 0, date,
  });

  const shareText = `Rank Arena Daily #${challengeNumber} — ${score}/${totalRounds}. Beat me at ${arenaUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: arenaUrl });
        return;
      } catch { /* fall through to copy */ }
    }
    handleCopy();
  }

  return (
    <div
      className="absolute inset-0 flex flex-col tag-anim-fade-in overflow-hidden"
      style={{ background: 'var(--tag-surface-midnight)' }}
    >
      {/* Header */}
      <div
        className="relative px-6 py-3"
        style={{ background: 'var(--tag-gradient-border)', backgroundSize: '200% 200%', animation: 'tag-border-flow 6s ease infinite' }}
      >
        <button
          onClick={onClose}
          aria-label="Close share card"
          className="absolute top-3 right-3"
          style={{ color: 'rgba(11, 15, 26, 0.65)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center" style={{ color: 'var(--tag-surface-void)' }}>
          <h3 style={{ fontFamily: 'var(--tag-font-display)', fontSize: '1.25rem', letterSpacing: '0.02em' }}>RANK ARENA</h3>
          <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.125rem' }}>
            Daily #{challengeNumber} · {formatDate(date)}
          </p>
        </div>
      </div>

      {/* Image preview */}
      <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center overflow-hidden">
        <div
          className="w-full max-w-[400px] overflow-hidden"
          style={{
            borderRadius: 'var(--tag-radius-lg)',
            border: '1px solid var(--tag-border-hairline)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <img
            src={imagePreviewUrl}
            alt="Share card preview"
            className="w-full h-auto block"
            loading="eager"
          />
        </div>
        <p className="mt-3 text-center" style={{ color: 'var(--tag-text-muted)', fontSize: '0.75rem' }}>
          This is what others will see when you share.
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex gap-3">
        <button
          onClick={handleCopy}
          className="tag-btn-ghost tag-btn-xl flex-1"
          style={copied ? { background: 'var(--tag-status-success)', color: 'var(--tag-surface-void)', borderColor: 'var(--tag-status-success)' } : undefined}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          onClick={handleShare}
          className="tag-btn-primary tag-btn-xl flex-1"
        >
          {(typeof navigator !== 'undefined' && navigator.share) ? 'SHARE' : 'COPY LINK'}
        </button>
      </div>
    </div>
  );
}
