import { useNavigate } from 'react-router-dom';
import useGame from '../hooks/useGame';
import useStreak from '../hooks/useStreak';
import GameCard from '../components/GameCard';
import StatBadge from '../components/StatBadge';
import ActionButtons from '../components/ActionButtons';
import ResultsModal from '../components/ResultsModal';

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

  // Record streak when game completes
  if (isComplete && challengeData?.date) {
    recordPlay(challengeData.date);
  }

  function getCardState(side) {
    if (state === STATES.IDLE || state === STATES.ROUND_ACTIVE || state === STATES.LOADING) {
      return 'idle';
    }
    if (state === STATES.REVEALING || state === STATES.NEXT_ROUND || state === STATES.GAME_OVER) {
      if (isCorrect === null) return 'idle';
      // Find the last result to determine which card was picked
      const lastResult = results[results.length - 1];
      if (!lastResult) return 'idle';

      if (isCorrect) {
        // Both cards show as "correct" state when answer is right
        return side === lastResult.correctAnswer ? 'correct' : 'winner';
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
          <span className="score-counter text-accent-blue">{score}</span>
          <span className="text-text-secondary text-sm">
            Round {Math.min(currentRound + 1, totalRounds)} / {totalRounds}
          </span>
        </div>
        {streak.current > 0 && (
          <span className="text-sm text-accent-gold">{'\u{1F525}'} {streak.current} day streak</span>
        )}
      </div>

      {/* Game area */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-0 max-w-4xl mx-auto">
        {/* Game A */}
        <div className="w-full md:w-[45%]">
          <GameCard
            game={gameA}
            statValue={gameAStat}
            statCategory={statCategory}
            statLabel={statLabel}
            cardState={getCardState('a')}
            onClick={() => makeChoice('a')}
            disabled={buttonsDisabled}
            isRevealing={isRevealing}
          />
        </div>

        {/* Stat badge divider */}
        <div className="flex items-center justify-center md:w-[10%] -my-3 md:my-0">
          <StatBadge statCategory={statCategory} />
        </div>

        {/* Game B */}
        <div className="w-full md:w-[45%]">
          <GameCard
            game={gameB}
            statValue={gameBStat}
            statCategory={statCategory}
            statLabel={statLabel}
            cardState={getCardState('b')}
            onClick={() => makeChoice('b')}
            disabled={buttonsDisabled}
            isRevealing={isRevealing}
          />
        </div>
      </div>

      {/* Action buttons */}
      <ActionButtons
        onHigher={() => makeChoice('a')}
        onLower={() => makeChoice('b')}
        disabled={buttonsDisabled}
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
