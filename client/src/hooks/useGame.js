import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTodayChallenge, submitAnswer, fetchEndlessPair, submitEndlessAnswer, submitChallengeResult, submitEndlessResult } from '../lib/api';

// States: LOADING | IDLE | ROUND_ACTIVE | REVEALING | NEXT_ROUND | GAME_OVER
const STATES = {
  LOADING: 'LOADING',
  IDLE: 'IDLE',
  ROUND_ACTIVE: 'ROUND_ACTIVE',
  REVEALING: 'REVEALING',
  NEXT_ROUND: 'NEXT_ROUND',
  GAME_OVER: 'GAME_OVER',
};

function getStorageKey(date) {
  return `rankArena_daily_${date}`;
}

export default function useGame(mode = 'challenge') {
  const [state, setState] = useState(STATES.LOADING);
  const [challengeData, setChallengeData] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameA, setGameA] = useState(null);
  const [gameB, setGameB] = useState(null);
  const [statCategory, setStatCategory] = useState('');
  const [statLabel, setStatLabel] = useState('');
  const [gameAStat, setGameAStat] = useState(null);
  const [gameBStat, setGameBStat] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const usedGameIds = useRef(new Set());

  // Load challenge or endless pair
  useEffect(() => {
    if (mode === 'challenge') {
      loadChallenge();
    } else {
      loadEndlessPair();
    }
  }, [mode]);

  async function loadChallenge() {
    setState(STATES.LOADING);
    setError(null);
    try {
      const data = await fetchTodayChallenge();
      setChallengeData(data);

      // Check localStorage for completed game
      const stored = localStorage.getItem(getStorageKey(data.date));
      if (stored) {
        const parsed = JSON.parse(stored);
        setScore(parsed.score);
        setResults(parsed.results || []);
        setCurrentRound(parsed.results?.length || 0);
        setStatCategory(data.statCategory);
        setStatLabel(data.statLabel);
        setIsComplete(true);
        setState(STATES.GAME_OVER);
        return;
      }

      // Check for in-progress game
      const progressKey = `rankArena_progress_${data.date}`;
      const progress = localStorage.getItem(progressKey);
      if (progress) {
        const parsed = JSON.parse(progress);
        setScore(parsed.score);
        setResults(parsed.results || []);
        setCurrentRound(parsed.currentRound);
        setStatCategory(data.statCategory);
        setStatLabel(data.statLabel);

        if (parsed.currentRound < data.matchups.length) {
          const matchup = data.matchups[parsed.currentRound];
          setGameA(matchup.game_a);
          setGameB(matchup.game_b);
          setState(STATES.IDLE);
          return;
        }
      }

      // Fresh game
      setStatCategory(data.statCategory);
      setStatLabel(data.statLabel);
      setCurrentRound(0);
      setScore(0);
      setResults([]);

      if (data.matchups.length > 0) {
        setGameA(data.matchups[0].game_a);
        setGameB(data.matchups[0].game_b);
      }
      setState(STATES.IDLE);
    } catch (err) {
      setError(err.message);
      setState(STATES.LOADING);
    }
  }

  async function loadEndlessPair() {
    setState(STATES.LOADING);
    setError(null);
    try {
      const excludeArr = Array.from(usedGameIds.current);
      // Clear exclude set if too large (with 50 games, we need to recycle)
      if (excludeArr.length > 30) {
        usedGameIds.current.clear();
      }
      const data = await fetchEndlessPair(Array.from(usedGameIds.current));
      setGameA(data.game_a);
      setGameB(data.game_b);
      setStatCategory(data.statCategory);
      setStatLabel(data.statLabel);
      setGameAStat(null);
      setGameBStat(null);
      setIsCorrect(null);
      setState(STATES.IDLE);
    } catch (err) {
      setError(err.message);
    }
  }

  const makeChoice = useCallback(async (choice) => {
    if (state !== STATES.IDLE) return;

    setState(STATES.ROUND_ACTIVE);
    setGameAStat(null);
    setGameBStat(null);
    setIsCorrect(null);

    try {
      let result;
      if (mode === 'challenge') {
        result = await submitAnswer(currentRound, choice, challengeData.date);
      } else {
        result = await submitEndlessAnswer(gameA.id, gameB.id, statCategory, choice);
      }

      setGameAStat(result.game_a_stat);
      setGameBStat(result.game_b_stat);
      setIsCorrect(result.correct);
      setState(STATES.REVEALING);

      // Track used game IDs for endless mode
      if (mode === 'endless') {
        usedGameIds.current.add(gameA.id);
        usedGameIds.current.add(gameB.id);
      }

      // Record result
      const roundResult = {
        round: currentRound,
        correct: result.correct,
        choice,
        gameA: { ...gameA },
        gameB: { ...gameB },
        gameAStat: result.game_a_stat,
        gameBStat: result.game_b_stat,
        correctAnswer: result.correctAnswer,
      };

      const newResults = [...results, roundResult];
      setResults(newResults);

      if (result.correct) {
        const newScore = score + 1;
        setScore(newScore);

        // Save progress for challenge mode
        if (mode === 'challenge') {
          const progressKey = `rankArena_progress_${challengeData.date}`;
          localStorage.setItem(progressKey, JSON.stringify({
            score: newScore,
            results: newResults,
            currentRound: currentRound + 1,
          }));
        }
      }

      // After reveal animation
      setTimeout(() => {
        if (!result.correct) {
          finishGame(result.correct ? score + 1 : score, newResults);
        } else if (mode === 'challenge' && currentRound >= challengeData.matchups.length - 1) {
          // Completed all rounds
          finishGame(score + 1, newResults);
        } else {
          setState(STATES.NEXT_ROUND);
        }
      }, 1500);

    } catch (err) {
      setError(err.message);
      setState(STATES.IDLE);
    }
  }, [state, mode, currentRound, challengeData, gameA, gameB, statCategory, score, results]);

  function finishGame(finalScore, finalResults) {
    setScore(finalScore);
    setIsComplete(true);
    setState(STATES.GAME_OVER);

    if (mode === 'challenge' && challengeData) {
      // Save to localStorage
      const key = getStorageKey(challengeData.date);
      localStorage.setItem(key, JSON.stringify({
        score: finalScore,
        results: finalResults,
        completed: true,
        date: challengeData.date,
      }));

      // Clean up progress
      localStorage.removeItem(`rankArena_progress_${challengeData.date}`);

      // Submit to server — track if it was saved
      submitChallengeResult(challengeData.date, finalScore)
        .then(res => {
          if (res?.saved) {
            markScoreSynced('daily', challengeData.date);
          } else {
            queueUnsyncedScore('daily', { date: challengeData.date, score: finalScore });
          }
        })
        .catch(() => {
          queueUnsyncedScore('daily', { date: challengeData.date, score: finalScore });
        });
    }

    if (mode === 'endless' && finalScore > 0) {
      submitEndlessResult(finalScore)
        .then(res => {
          if (!res?.saved) {
            queueUnsyncedScore('endless', { score: finalScore, timestamp: Date.now() });
          }
        })
        .catch(() => {
          queueUnsyncedScore('endless', { score: finalScore, timestamp: Date.now() });
        });
    }
  }

  const nextRound = useCallback(() => {
    if (state !== STATES.NEXT_ROUND) return;

    const nextIdx = currentRound + 1;
    setCurrentRound(nextIdx);
    setGameAStat(null);
    setGameBStat(null);
    setIsCorrect(null);

    if (mode === 'challenge' && challengeData) {
      if (nextIdx < challengeData.matchups.length) {
        const matchup = challengeData.matchups[nextIdx];
        setGameA(matchup.game_a);
        setGameB(matchup.game_b);
        setState(STATES.IDLE);
      }
    } else if (mode === 'endless') {
      loadEndlessPair();
    }
  }, [state, currentRound, mode, challengeData]);

  const restart = useCallback(() => {
    setScore(0);
    setResults([]);
    setCurrentRound(0);
    setIsCorrect(null);
    setGameAStat(null);
    setGameBStat(null);
    setIsComplete(false);
    usedGameIds.current.clear();

    if (mode === 'endless') {
      loadEndlessPair();
    }
  }, [mode]);

  return {
    state,
    currentRound,
    totalRounds: challengeData?.matchups?.length || 0,
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
    restart,
    STATES,
  };
}

// --- Unsynced score queue (for guest → login flow) ---

const UNSYNCED_KEY = 'rankArena_unsynced_scores';

function queueUnsyncedScore(type, data) {
  try {
    const existing = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
    // Avoid duplicates for daily (same date)
    if (type === 'daily') {
      const alreadyQueued = existing.some(e => e.type === 'daily' && e.data.date === data.date);
      if (alreadyQueued) return;
    }
    existing.push({ type, data });
    localStorage.setItem(UNSYNCED_KEY, JSON.stringify(existing));
  } catch {
    // localStorage full or unavailable
  }
}

function markScoreSynced(type, dateOrId) {
  try {
    const existing = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
    const filtered = existing.filter(e => {
      if (type === 'daily') return !(e.type === 'daily' && e.data.date === dateOrId);
      return !(e.type === 'endless' && e.data.timestamp === dateOrId);
    });
    localStorage.setItem(UNSYNCED_KEY, JSON.stringify(filtered));
  } catch {}
}

function getUnsyncedScores() {
  try {
    return JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]');
  } catch {
    return [];
  }
}

function clearUnsyncedScores() {
  localStorage.removeItem(UNSYNCED_KEY);
}

export { STATES, getUnsyncedScores, clearUnsyncedScores };
