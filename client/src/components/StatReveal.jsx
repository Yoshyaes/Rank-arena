import useCounter from '../hooks/useCounter';

export default function StatReveal({ value, statCategory, statLabel, animate = true }) {
  const display = useCounter(value, {
    duration: 600,
    shouldAnimate: animate,
    statCategory,
  });

  return (
    <div className="flex flex-col items-center">
      <span className="stat-number text-text-primary">{display}</span>
      <span className="stat-label mt-1">{statLabel}</span>
    </div>
  );
}
