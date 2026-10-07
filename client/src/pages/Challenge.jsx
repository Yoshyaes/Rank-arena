import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useGame from '../hooks/useGame';
import useStreak from '../hooks/useStreak';
import useMobileConfirm from '../hooks/useMobileConfirm';
import GameCard from '../components/GameCard';
import StatBadge from '../components/StatBadge';
import ActionButtons from '../components/ActionButtons';
import ResultsModal from '../components/ResultsModal';
import RawgCredit from '../components/RawgCredit';

const AUTO_ADVANCE_MS = 1500;

export default function Challenge() {
  const navigate = useNavigate();
  const { streak, recordPlay } = useStreak();
  const {
    state,
    currentRound,
    totalRounds,
    gameA,
    gameB,
    statCategory,
    statLabel,
    gameAStat,
    gameBStat,
    isCorrect,
    score,
    results,
    error,
    isComplete,
    challengeData,
    makeChoice,
    nextRound,
    STATES,
  } = useGame('challenge');

  const { selectedCard, handleCardTap, handleConfirm, resetSelection, selectCard } = useMobileConfirm(makeChoice);
  const cardARef = useRef(null);
  const cardBRef = useRef(null);

  // Reset selection when round changes
  useEffect(() => {
    resetSelection();
  }, [currentRound, resetSelection]);

  // R5: move focus to card A whenever a new round renders.
  useEffect(() => {
    if (state === STATES.IDLE) cardARef.current?.focus();
  }, [currentRound, state, STATES.IDLE]);

  // R5: auto-advance 1.5s after a reveal; any key or tap skips the wait.
  useEffect(() => {
    if (state !== STATES.NEXT_ROUND) return;
    const timer = setTimeout(nextRound, AUTO_ADVANCE_MS);
    function skip() { clearTimeout(timer); nextRound(); }
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [state, STATES.NEXT_ROUND, nextRound]);

  // R5: Left/1 selects card A, Right/2 selects card B, Enter/Space confirms.
  // Goes through selectCard (not handleCardTap) so desktop keyboard users
  // get the same select-then-confirm step mobile tap already has, instead
  // of a click's immediate submit.
  useEffect(() => {
    function onKeyDown(e) {
      if (state !== STATES.IDLE) return;
      if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        selectCard('a');
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        selectCard('b');
      } else if ((e.key === 'Enter' || e.key === ' ') && selectedCard) {
        e.preventDefault();
        handleConfirm();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, STATES.IDLE, selectedCard, selectCard, handleConfirm]);

  // Record streak when game completes
  useEffect(() => {
    if (isComplete && challengeData?.date) {
      recordPlay(challengeData.date);
    }
  }, [isComplete, challengeData?.date, recordPlay]);

  function getCardState(side) {
    if (state === STATES.IDLE && selectedCard === side) return 'selected';
    if (state === STATES.ROUND_ACTIVE && selectedCard === side) return 'selected';
    if (state === STATES.IDLE || state === STATES.ROUND_ACTIVE || state === STATES.LOADING) {
      return 'idle';
    }
    if (state === STATES.REVEALING || state === STATES.NEXT_ROUND || state === STATES.GAME_OVER) {
      if (isCorrect === null) return 'idle';
      // Find the last result to determine which card was picked
      const lastResult = results[results.length - 1];
      if (!lastResult) return 'idle';

      if (isCorrect) {
        // Only the picked (correct) card shows "correct"; the other card is
        // idle, not "winner" -- there's no winner when the player was right.
        return side === lastResult.correctAnswer ? 'correct' : 'idle';
      } else {
        // Wrong: the picked card is wrong, the other is the winner
        return side === lastResult.choice ? 'wrong' : 'winner';
      }
    }
    return 'idle';
  }

  const isRevealing = state === STATES.REVEALING || state === STATES.NEXT_ROUND ||
    (state === STATES.GAME_OVER && results.length > 0 && !isComplete);
  const buttonsDisabled = state !== STATES.IDLE;

  if (state === STATES.LOADING && !error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-text-secondary text-lg animate-pulse">Loading today's challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
        <p className="text-accent-lose text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-text px-6 py-3 rounded-full bg-accent-blue text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header info */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-text-secondary text-sm uppercase tracking-wide">
            Daily #{challengeData?.challengeNumber}
          </span>
          <span className="score-counter text-accent-blue">{score} / {totalRounds}</span>
          <span className="text-text-secondary text-sm">
            Round {Math.min(currentRound + 1, totalRounds)} / {totalRounds}
          </span>
        </div>
        {streak.current > 0 && (
          <span className="text-sm text-accent-gold">{'\u{1F525}'} {streak.current} day streak</span>
        )}
      </div>

      {/* Game area - always side-by-side so both games are visible without scrolling. */}
      <div className="relative flex flex-row items-stretch gap-2 sm:gap-3 md:gap-0 max-w-4xl mx-auto">
        <div className="flex-1 min-w-0 md:w-[45%] md:flex-none">
          <GameCard
            ref={cardARef}
            game={gameA}
            statValue={gameAStat}
            statCategory={statCategory}
            statLabel={statLabel}
            cardState={getCardState('a')}
            onClick={() => handleCardTap('a')}
            disabled={buttonsDisabled}
            isRevealing={isRevealing}
          />
        </div>

        {/* Stat badge - desktop only (R3): on phones it floated over the cards
            with no room to spare, so it's dropped there rather than shrunk. */}
        <div className="hidden md:flex items-center justify-center md:w-[10%]">
          <StatBadge statCategory={statCategory} />
        </div>

        <div className="flex-1 min-w-0 md:w-[45%] md:flex-none">
          <GameCard
            ref={cardBRef}
            game={gameB}
            statValue={gameBStat}
            statCategory={statCategory}
            statLabel={statLabel}
            cardState={getCardState('b')}
            onClick={() => handleCardTap('b')}
            disabled={buttonsDisabled}
            isRevealing={isRevealing}
          />
        </div>
      </div>

      {/* Action buttons */}
      <ActionButtons
        onHigher={() => handleCardTap('a')}
        onLower={() => handleCardTap('b')}
        disabled={buttonsDisabled}
        gameATitle={gameA?.title}
        gameBTitle={gameB?.title}
        selectedCard={selectedCard}
        onConfirm={handleConfirm}
        statCategory={statCategory}
      />

      {/* Next round button */}
      {state === STATES.NEXT_ROUND && (
        <div className="text-center mt-4">
          <button
            onClick={nextRound}
            className="btn-text px-8 py-3 rounded-full bg-accent-win text-white hover:brightness-110 transition-all"
          >
            Next &rarr;
          </button>
        </div>
      )}

      <RawgCredit />

      {/* Results modal */}
      <ResultsModal
        visible={state === STATES.GAME_OVER && isComplete}
        score={score}
        totalRounds={totalRounds}
        results={results}
        statCategory={statCategory}
        statLabel={statLabel}
        challengeNumber={challengeData?.challengeNumber}
        date={challengeData?.date}
        streak={streak}
        mode="challenge"
        onPlayEndless={() => navigate('/endless')}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    </div>
  );
}
