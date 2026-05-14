function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

export default function ActionButtons({
  onHigher, onLower, disabled = false,
  gameATitle, gameBTitle, selectedCard, onConfirm,
}) {
  const nameA = gameATitle ? truncate(gameATitle, 14) : 'LEFT';
  const nameB = gameBTitle ? truncate(gameBTitle, 14) : 'RIGHT';

  return (
    <>
      {/* Inline (desktop): two side-by-side picker buttons */}
      <div className="hidden sm:block mt-6 max-w-2xl mx-auto">
        <p className="text-center mb-3" style={{ color: 'var(--tag-text-secondary)', fontSize: '0.875rem' }}>
          Which has the higher stat? Tap a card or use a button.
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
          The TAG site renders its own #tag-bottom-bar (community nav) at
          fixed bottom:0 z-40 on mobile, so we sit ABOVE it with a 64px offset
          plus safe-area inset, and z-50 so the CTAs are always reachable. */}
      <div
        className="sm:hidden"
        style={{
          position: 'fixed',
          bottom: 'calc(var(--ra-bottom-offset, 64px) + env(safe-area-inset-bottom, 0px))',
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
