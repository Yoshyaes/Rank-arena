import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="py-6 sm:py-10">
      <div className="text-center mb-6">
        <span className="tag-pixel-label">LEADERBOARD</span>
        <h1 className="tag-h1 mt-2" style={{ fontFamily: 'var(--tag-font-display)' }}>
          Top Players
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-[2px] w-24 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--tag-accent-cyan), var(--tag-accent-purple), transparent)' }}
        />
      </div>
      <Leaderboard />
    </div>
  );
}
