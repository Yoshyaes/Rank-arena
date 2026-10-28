import { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import useCounter from '../hooks/useCounter';
import useSwipeVote from '../hooks/useSwipeVote';
import { COUNT_UP_MS } from '../hooks/useRevealHaptics';
import { juicePress, juicePop, reducedMotion } from '../lib/touchKit';

// Short labels for the per-card stat chip. The full label still appears in the
// floating StatBadge between the two cards, so we don't need to repeat it here
// at full width on narrow phones.
const STAT_SHORT = {
  metacritic:        'META',
  sales_millions:    'SALES',
  peak_players:      'PEAK',
  avg_playtime_hours:'HOURS',
  user_score:        'USER',
};

const GameCard = forwardRef(function GameCard({
  game,
  statValue,
  statCategory,
  statLabel,
  cardState = 'idle', // 'idle' | 'selected' | 'correct' | 'wrong' | 'winner'
  onClick,
  disabled = false,
  isRevealing = false,
  // Touch only (see useSwipeVote): drag the card up past the line to vote.
  swipeToVote = false,
  onSwipeVote,
  // Short instruction shown on the selected card, e.g. "Tap again to lock in".
  selectedHint = null,
}, ref) {
  const [imgError, setImgError] = useState(false);
  const innerRef = useRef(null);
  const setRefs = useCallback((node) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);
  const swipe = useSwipeVote(innerRef, { enabled: swipeToVote && !disabled, onVote: onSwipeVote });
  const handleClick = (e) => {
    if (swipe.consumeClick()) { e.preventDefault(); return; }
    onClick?.(e);
  };
  // Phase 3 juice: a finger press squashes the card the same frame, with a
  // light tick (kit 1.1 juice.press; touch and pen only, so mouse and
  // keyboard are unchanged; a no-op without the kit).
  const cardOpen = !disabled && (cardState === 'idle' || cardState === 'selected');
  const handlers = {
    ...swipe.handlers,
    onPointerDown: (e) => {
      swipe.handlers.onPointerDown(e);
      if (cardOpen && (e.pointerType === 'touch' || e.pointerType === 'pen')) juicePress(innerRef.current, 'tick');
    },
  };

  const displayValue = useCounter(statValue, {
    duration: 600,
    shouldAnimate: isRevealing,
    statCategory,
  });

  // B4 changed the unpicked-correct card's state from 'winner' to 'idle' (it
  // shouldn't show a WIN badge when the player was right), but that state
  // also used to be this component's only signal to reveal the stat value --
  // so the fix for the badge silently broke the reveal for that card too.
  // isRevealing is the real "has this round been answered" signal; use that
  // instead of overloading cardState for both jobs.
  const showStat = isRevealing || (cardState !== 'idle' && cardState !== 'selected');
  const isSelected = cardState === 'selected';
  const isCorrect = cardState === 'correct';
  const isWinner = cardState === 'winner';
  const isWrong = cardState === 'wrong';

  // Phase 3 success beat: the correct card pops as the count-up lands (the
  // success haptic is fired by useRevealHaptics at the same moment).
  useEffect(() => {
    if (!isCorrect) return undefined;
    const t = setTimeout(() => juicePop(innerRef.current), reducedMotion() ? 0 : COUNT_UP_MS);
    return () => clearTimeout(t);
  }, [isCorrect]);

  const ringClass = isSelected
    ? 'ring-2 ring-tag-cyan ring-offset-2 ring-offset-tag-void'
    : isCorrect
    ? 'ring-2 ring-tag-success ring-offset-2 ring-offset-tag-void'
    : isWrong
    ? 'ring-2 ring-tag-error ring-offset-2 ring-offset-tag-void'
    : '';

  const shortLabel = STAT_SHORT[statCategory] || statLabel;

  return (
    <button
      ref={setRefs}
      onClick={handleClick}
      {...handlers}
      data-swipe={swipeToVote && !disabled ? (swipe.armed ? 'armed' : swipe.dragging ? 'drag' : 'ready') : undefined}
      aria-label={game?.title ? `Select ${game.title}` : 'Select this game'}
      disabled={disabled || (cardState !== 'idle' && cardState !== 'selected')}
      className={`tag-card relative w-full h-full text-left cursor-pointer transition-all duration-150 ease-out ${ringClass} ${disabled && cardState === 'idle' ? 'opacity-70 cursor-not-allowed' : ''}`}
      style={{
        background: 'var(--tag-gradient-card)',
        display: 'flex',
        flexDirection: 'column',
        // While a swipe can vote, vertical drags on the card belong to the game, not page scroll.
        touchAction: swipeToVote && !disabled ? 'none' : undefined,
      }}
    >
      {/* Swipe-to-vote guide: follows the drag, flips to "Release" past the line */}
      {swipe.dragging && (
        <div className="ra-swipe-chip" data-armed={swipe.armed ? 'true' : 'false'} aria-hidden="true">
          <span className="ra-swipe-arrow">&uarr;</span>
          {swipe.armed ? 'Release to vote' : 'Swipe up to vote'}
        </div>
      )}
      {!swipe.dragging && cardState === 'selected' && selectedHint && (
        <div className="ra-swipe-chip ra-select-hint" aria-hidden="true">{selectedHint}</div>
      )}

      {/* Result tint overlay */}
      {isCorrect && (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'rgba(34, 197, 94, 0.10)' }} />
      )}
      {isWrong && (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'rgba(239, 68, 68, 0.18)' }} />
      )}

      {/* Result icon */}
      {isCorrect && (
        <div className="absolute top-2 right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--tag-status-success)' }}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {isWrong && (
        <div className="absolute top-2 right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--tag-status-error)' }}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      {isWinner && (
        <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--tag-status-gold)', color: 'var(--tag-surface-void)', fontFamily: 'var(--tag-font-pixel)' }}>
          WIN
        </div>
      )}

      {/* Cover art. Square on mobile, 16:10 on tablet+, so the card stays compact at narrow widths. */}
      <div
        className="ra-cover relative w-full overflow-hidden"
        style={{ background: 'var(--tag-surface-steel)' }}
      >
        {game?.cover_url && !imgError ? (
          <img
            src={game.cover_url}
            alt={game?.title}
            loading="lazy"
            width={640}
            height={400}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(34, 197, 212, 0.25), transparent 60%), radial-gradient(circle at 70% 70%, rgba(108, 99, 255, 0.20), transparent 60%), linear-gradient(135deg, var(--tag-surface-steel), var(--tag-surface-midnight))',
            }}
          >
            <span
              className="absolute top-2 left-2 sm:top-3 sm:left-4"
              style={{
                fontFamily: 'var(--tag-font-pixel)',
                fontSize: '0.5rem',
                color: 'var(--tag-accent-cyan)',
                letterSpacing: '0.05em',
              }}
            >
              {game?.year || 'GAME'}
            </span>
            <span
              style={{
                fontFamily: 'var(--tag-font-display)',
                fontSize: 'clamp(2.5rem, 9vw, 5rem)',
                color: 'var(--tag-text-primary)',
                opacity: 0.85,
                textShadow: '0 0 24px rgba(34, 197, 212, 0.35)',
              }}
            >
              {game?.title?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Info zone - compact on mobile, full on sm+. Fixed-height title block
          and an auto-margin stat chip so genre row + stat zone align across
          cards regardless of title length. */}
      <div className="p-2.5 sm:p-4 relative z-10 flex-1 flex flex-col">
        <div
          className="ra-title-block"
          style={{
            // Reserve room for ~2 lines of title at the current font size so the
            // genre row below always lands on the same baseline across both cards.
            minHeight: '2.6em',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <h3
            className="ra-card-title"
            style={{
              fontSize: 'clamp(0.8125rem, 2.6vw, 1.125rem)',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {game?.title || 'Loading...'}
          </h3>
        </div>
        <div
          className="ra-meta-row flex items-center gap-1.5 mt-1.5"
          style={{ minHeight: '1.5rem' }}
        >
          {game?.year ? (
            <span className="text-tag-text-secondary text-[11px] sm:text-xs">{game.year}</span>
          ) : null}
          {game?.genre?.slice(0, 1).map(g => (
            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--tag-surface-steel)', color: 'var(--tag-text-secondary)' }}>
              {g}
            </span>
          ))}
          {game?.genre?.slice(1, 2).map(g => (
            <span key={g} className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--tag-surface-steel)', color: 'var(--tag-text-secondary)' }}>
              {g}
            </span>
          ))}
        </div>

        {/* Stat zone pinned to the bottom of the info column with margin-top:auto. */}
        <div
          className="py-2 px-2 sm:py-3 sm:px-3 rounded-tag-md flex flex-col items-center justify-center"
          style={{
            background: 'var(--tag-surface-steel)',
            border: '1px solid var(--tag-border-hairline)',
            minHeight: 'clamp(56px, 14vw, 88px)',
            marginTop: 'auto',
            marginBlockStart: 'auto',
          }}
        >
          {showStat ? (
            <>
              <span
                style={{
                  fontFamily: 'var(--tag-font-display)',
                  fontSize: 'clamp(1.25rem, 5vw, 2.625rem)',
                  lineHeight: 1.05,
                  color: isCorrect ? 'var(--tag-status-success)' : isWrong ? 'var(--tag-status-error)' : 'var(--tag-text-primary)',
                  textShadow: isCorrect ? '0 0 18px rgba(34, 197, 94, 0.4)' : 'none',
                }}
              >
                {displayValue}
              </span>
              <span className="ra-stat-label mt-1 whitespace-nowrap" style={{ fontSize: '0.5625rem' }}>
                {shortLabel}
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontFamily: 'var(--tag-font-display)',
                  fontSize: 'clamp(1.25rem, 5vw, 2.625rem)',
                  lineHeight: 1.05,
                  color: 'var(--tag-text-muted)',
                }}
              >
                ?
              </span>
              <span className="ra-stat-label mt-1 whitespace-nowrap" style={{ fontSize: '0.5625rem' }}>
                {shortLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

export default GameCard;
