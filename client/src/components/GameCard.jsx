import { useState } from 'react';
import useCounter from '../hooks/useCounter';

export default function GameCard({
  game,
  statValue,
  statCategory,
  statLabel,
  cardState = 'idle', // 'idle' | 'selected' | 'correct' | 'wrong' | 'winner'
  onClick,
  disabled = false,
  isRevealing = false,
}) {
  const [imgError, setImgError] = useState(false);

  const displayValue = useCounter(statValue, {
    duration: 600,
    shouldAnimate: isRevealing,
    statCategory,
  });

  const showStat = cardState !== 'idle' && cardState !== 'selected';
  const isSelected = cardState === 'selected';
  const isCorrect = cardState === 'correct';
  const isWinner = cardState === 'winner';
  const isWrong = cardState === 'wrong';
  const isRevealed = isCorrect || isWinner;

  return (
    <button
      onClick={onClick}
      aria-label={game?.title ? `Select ${game.title}` : 'Select this game'}
      disabled={disabled || (cardState !== 'idle' && cardState !== 'selected')}
      className={`
        relative w-full rounded-2xl overflow-hidden transition-all duration-150 ease-out
        border-2 text-left cursor-pointer
        ${cardState === 'idle' ? 'border-border bg-bg-card hover:border-accent-blue hover:bg-bg-card-hover hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}
        ${isSelected && !disabled ? 'border-accent-blue bg-bg-card-hover shadow-[0_0_24px_rgba(59,130,246,0.25)]' : ''}
        ${isSelected && disabled ? 'border-accent-blue bg-bg-card-hover shadow-[0_0_24px_rgba(59,130,246,0.25)] animate-pulse' : ''}
        ${isCorrect ? 'border-accent-win' : ''}
        ${isWinner ? 'border-border' : ''}
        ${isWrong ? 'border-accent-lose' : ''}
        ${disabled && cardState === 'idle' ? 'opacity-70 cursor-not-allowed' : ''}
        focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-primary
      `}
    >
      {/* Result overlay */}
      {isCorrect && (
        <div className="absolute inset-0 bg-accent-win/10 z-10 pointer-events-none" />
      )}
      {isWrong && (
        <div className="absolute inset-0 bg-accent-lose/20 z-10 pointer-events-none" />
      )}

      {/* Result icon */}
      {isCorrect && (
        <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-accent-win flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {isWrong && (
        <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-accent-lose flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}

      {/* Cover art */}
      <div className="relative w-full aspect-[16/10] bg-bg-surface overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-surface to-bg-card">
            <span className="text-text-secondary text-2xl font-bold opacity-40">
              {game?.title?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Game info */}
      <div className="p-4">
        <h3 className="card-title text-text-primary truncate">{game?.title || 'Loading...'}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-text-secondary text-xs">{game?.year}</span>
          {game?.genre?.slice(0, 2).map(g => (
            <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-text-secondary">
              {g}
            </span>
          ))}
        </div>

        {/* Stat zone */}
        <div className="mt-4 py-3 rounded-xl bg-bg-surface flex flex-col items-center justify-center min-h-[80px]">
          {showStat ? (
            <>
              <span className="stat-number text-text-primary">{displayValue}</span>
              <span className="stat-label mt-1">{statLabel}</span>
            </>
          ) : (
            <>
              <span className="font-grotesk text-4xl font-extrabold text-text-secondary">?</span>
              <span className="stat-label mt-1">{statLabel}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
