import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGame from '../hooks/useGame';
import useMobileConfirm from '../hooks/useMobileConfirm';
import GameCard from '../components/GameCard';
import StatBadge from '../components/StatBadge';
import ActionButtons from '../components/ActionButtons';
import ResultsModal from '../components/ResultsModal';

const BEST_KEY = 'rankArena_endless_best';

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

  const { selectedCard, handleCardTap, handleConfirm, resetSelection } = useMobileConfirm(makeChoice);

  // Reset selection when round changes
  useEffect(() => {
    resetSelection();
  }, [currentRound, resetSelection]);

  // Update personal best on game over
  useEffect(() => {
    if (isComplete) {
      setPersonalBest(score);
    }
  }, [isComplete, score]);

  function getCardState(side) {
    if (state === STATES.IDLE && selectedCard === side) return 'selected';
    if (state === STATES.IDLE || state === STATES.ROUND_ACTIVE || state === STATES.LOADING) {
      return 'idle';
    }
    if (state === STATES.REVEALING || state === STATES.NEXT_ROUND || state === STATES.GAME_OVER) {
      if (isCorrect === null) return 'idle';
      const lastResult = results[results.length - 1];
      if (!lastResult) return 'idle';
      if (isCorrect) {
        return side === lastResult.correctAnswer ? 'correct' : 'winner';
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

      {/* Game area */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-0 max-w-4xl mx-auto">
        <div className="w-full md:w-[45%]">
          <GameCard
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

        <div className="flex items-center justify-center md:w-[10%] -my-3 md:my-0">
          <StatBadge statCategory={statCategory} />
        </div>

        <div className="w-full md:w-[45%]">
          <GameCard
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

      <ActionButtons
        onHigher={() => handleCardTap('a')}
        onLower={() => handleCardTap('b')}
        disabled={buttonsDisabled}
        gameATitle={gameA?.title}
        gameBTitle={gameB?.title}
        selectedCard={selectedCard}
        onConfirm={handleConfirm}
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

      {/* Results */}
      <ResultsModal
        visible={state === STATES.GAME_OVER && isComplete}
        score={score}
        totalRounds={score}
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
