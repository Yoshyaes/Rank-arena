import useAdClearance from '../hooks/useAdClearance';

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

const PROMPTS = {
  sales_millions:      'Which sold more copies?',
  metacritic:          'Which scored higher on Metacritic?',
  peak_players:        'Which peaked higher on Steam?',
  avg_playtime_hours:  'Which do people play longer?',
  user_score:          'Which rated higher by players?',
};
const DEFAULT_PROMPT = 'Which has the higher stat? Tap a card or use a button.';

export default function ActionButtons({
  onHigher, onLower, disabled = false,
  gameATitle, gameBTitle, selectedCard, onConfirm, statCategory,
}) {
  const nameA = gameATitle ? truncate(gameATitle, 14) : 'LEFT';
  const nameB = gameBTitle ? truncate(gameBTitle, 14) : 'RIGHT';
  const prompt = PROMPTS[statCategory] || DEFAULT_PROMPT;
  const adClearance = useAdClearance();

  return (
    <>
      {/* Inline (desktop): two side-by-side picker buttons */}
      <div className="hidden sm:block mt-6 max-w-2xl mx-auto">
        <p className="text-center mb-3" style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem' }}>
          {prompt}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => { vibrate(15); onHigher(); }}
            disabled={disabled}
            className="tag-btn-primary tag-btn-xl flex-1"
            style={selectedCard === 'a' ? { boxShadow: 'var(--tag-shadow-hover)', filter: 'brightness(1.1)' } : undefined}
          >
            <span className="truncate">{nameA}</span>
          </button>
          <button
            onClick={() => { vibrate(15); onLower(); }}
            disabled={disabled}
            className="tag-btn-ghost tag-btn-xl flex-1"
            style={selectedCard === 'b'
              ? { background: 'var(--tag-accent-purple)', color: 'var(--tag-surface-void)', borderColor: 'var(--tag-accent-purple)' }
              : undefined}
          >
            <span className="truncate">{nameB}</span>
          </button>
        </div>
      </div>

      {/* Sticky bottom (mobile): thumb-zone CTAs.
          `sm:hidden` must stay in step with MOBILE_BREAKPOINT (640) in
          useMobileConfirm, or a width range ends up with no Confirm.
          The TAG site renders its own #tag-bottom-bar (community nav) at
          fixed bottom:0 z-40 on mobile, so we sit ABOVE it with a 64px offset
          (--ra-bottom-offset, overridable by the host page) plus safe-area
          inset, and z-50 so the CTAs are always reachable.
          The theme lifts Mediavine's adhesion ad to that same bottom:64px, so
          the offset is floored at --ra-ad-clearance: the measured distance
          from the viewport bottom to the top of any visible bottom ad
          (useAdClearance). Confirm is never under an ad. */}
      <div
        className="sm:hidden"
        style={{
          '--ra-ad-clearance': `${adClearance}px`,
          position: 'fixed',
          bottom: 'max(calc(var(--ra-bottom-offset, 64px) + env(safe-area-inset-bottom, 0px)), var(--ra-ad-clearance, 0px))',
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '0.75rem 1rem',
          background: 'linear-gradient(to top, var(--tag-surface-void) 70%, rgba(11, 15, 26, 0.6) 92%, transparent)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {selectedCard && onConfirm ? (
          <button
            onClick={() => { vibrate([20, 40, 20]); onConfirm(); }}
            className="tag-btn-primary tag-btn-xl w-full"
            style={{ animation: 'tag-glow 2s ease-in-out infinite' }}
          >
            CONFIRM PICK
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { vibrate(15); onHigher(); }}
              disabled={disabled}
              className="tag-btn-primary tag-btn-xl flex-1"
            >
              <span className="truncate">{nameA}</span>
            </button>
            <button
              onClick={() => { vibrate(15); onLower(); }}
              disabled={disabled}
              className="tag-btn-ghost tag-btn-xl flex-1"
              style={{ background: 'var(--tag-accent-purple)', color: 'var(--tag-surface-void)', borderColor: 'var(--tag-accent-purple)' }}
            >
              <span className="truncate">{nameB}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
