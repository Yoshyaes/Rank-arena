import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useGame from '../hooks/useGame';
import useMobileConfirm from '../hooks/useMobileConfirm';
import useInputMode from '../hooks/useInputMode';
import useRevealHaptics from '../hooks/useRevealHaptics';
import useFirstVisitCoach from '../hooks/useFirstVisitCoach';
import { swallowNextClick } from '../lib/touchKit';
import GameCard from '../components/GameCard';
import StatBadge from '../components/StatBadge';
import ActionButtons from '../components/ActionButtons';
import ResultsModal from '../components/ResultsModal';
import RawgCredit from '../components/RawgCredit';

const BEST_KEY = 'rankArena_endless_best';
const AUTO_ADVANCE_MS = 1500;

function getPersonalBest() {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0');
  } catch {
    return 0;
  }
}

function setPersonalBest(score) {
  const current = getPersonalBest();
  if (score > current) {
    localStorage.setItem(BEST_KEY, String(score));
    return true;
  }
  return false;
}

export default function Endless() {
  const navigate = useNavigate();
  const {
    state,
    currentRound,
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
    makeChoice,
    nextRound,
    restart,
    STATES,
  } = useGame('endless');

  const inputMode = useInputMode();
  const { selectedCard, twoStep, handleCardTap, handleConfirm, resetSelection, selectCard, voteNow } =
    useMobileConfirm(makeChoice, currentRound, { touch: inputMode === 'touch' });
  // Phase 2 touch: haptic ticks while the stats count up, then success/fail.
  useRevealHaptics(state === STATES.REVEALING || state === STATES.NEXT_ROUND, isCorrect, currentRound);
  // When picking is two-step, a selected card says how to commit it (tap again, or Enter).
  const selectedHint = !twoStep ? null
    : inputMode === 'keyboard' ? 'Press Enter to lock in'
    : inputMode === 'touch' ? 'Tap again to lock in'
    : 'Click again to lock in';
  const canSwipe = state === STATES.IDLE;
  const cardARef = useRef(null);
  // Phase 3 first 20 seconds: ghost-hand swipe on a first touch visit;
  // finished by any vote.
  useFirstVisitCoach(cardARef, {
    ready: state === STATES.IDLE && inputMode === 'touch',
    voted: state !== STATES.IDLE && state !== STATES.LOADING,
  });
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
    function skip(e) {
      clearTimeout(timer);
      nextRound();
      // Touch: the tap that skips the wait must not also land on the next
      // round's card (Chrome/Safari touch adjustment snaps a tap near a card
      // onto it). Mouse and keyboard keep their old behaviour.
      if (e && (e.pointerType === 'touch' || e.pointerType === 'pen')) swallowNextClick();
    }
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [state, STATES.NEXT_ROUND, nextRound]);

  // R5: Left/1 selects card A, Right/2 selects card B, Enter/Space confirms.
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

  // Update personal best on game over
  useEffect(() => {
    if (isComplete) {
      setPersonalBest(score);
    }
  }, [isComplete, score]);

  function getCardState(side) {
    if (state === STATES.IDLE && selectedCard === side) return 'selected';
    if (state === STATES.ROUND_ACTIVE && selectedCard === side) return 'selected';
    if (state === STATES.IDLE || state === STATES.ROUND_ACTIVE || state === STATES.LOADING) {
      return 'idle';
    }
    if (state === STATES.REVEALING || state === STATES.NEXT_ROUND || state === STATES.GAME_OVER) {
      if (isCorrect === null) return 'idle';
      const lastResult = results[results.length - 1];
      if (!lastResult) return 'idle';
      if (isCorrect) {
        // Only the picked (correct) card shows "correct"; the other card is
        // idle, not "winner" -- there's no winner when the player was right.
        return side === lastResult.correctAnswer ? 'correct' : 'idle';
      } else {
        return side === lastResult.choice ? 'wrong' : 'winner';
      }
    }
    return 'idle';
  }

  const isRevealing = state === STATES.REVEALING || state === STATES.NEXT_ROUND;
  const buttonsDisabled = state !== STATES.IDLE;

  if (state === STATES.LOADING && !error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-text-secondary text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
        <p className="text-accent-lose text-lg">{error}</p>
        <button onClick={restart} className="btn-text px-6 py-3 rounded-full bg-accent-blue text-white">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-text-secondary text-sm uppercase tracking-wide">Endless Mode</span>
          <span className="score-counter text-accent-purple">{score}</span>
          <span className="text-text-secondary text-sm">Best: {getPersonalBest()}</span>
        </div>
      </div>

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
            swipeToVote={canSwipe}
            onSwipeVote={() => voteNow('a')}
            selectedHint={selectedHint}
            isRevealing={isRevealing}
          />
        </div>

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
            swipeToVote={canSwipe}
            onSwipeVote={() => voteNow('b')}
            selectedHint={selectedHint}
            isRevealing={isRevealing}
          />
        </div>
      </div>

      <ActionButtons
        onHigher={() => handleCardTap('a')}
        onLower={() => handleCardTap('b')}
        disabled={buttonsDisabled}
        gameATitle={gameA?.title}
        gameBTitle={gameB?.title}
        selectedCard={selectedCard}
        onConfirm={handleConfirm}
        statCategory={statCategory}
        inputMode={inputMode}
      />

      {/* Next round auto-advance for endless */}
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

      {/* Results */}
      <ResultsModal
        visible={state === STATES.GAME_OVER && isComplete}
        score={score}
        totalRounds={results.length}
        results={results}
        statCategory={statCategory}
        statLabel={statLabel}
        mode="endless"
        onPlayAgain={restart}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    </div>
  );
}
