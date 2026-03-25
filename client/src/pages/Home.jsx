import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center gap-8">
      <div>
        <h1 className="font-grotesk text-5xl md:text-6xl font-extrabold text-text-primary mb-3">
          RANK ARENA
        </h1>
        <p className="text-text-secondary text-lg max-w-md mx-auto">
          Which game has the higher stat? Test your gaming knowledge in the daily challenge.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/challenge"
          className="btn-text px-8 py-4 rounded-full bg-accent-blue text-white hover:brightness-110 transition-all"
        >
          Daily Challenge
        </Link>
        <Link
          to="/endless"
          className="btn-text px-8 py-4 rounded-full bg-accent-purple text-white hover:brightness-110 transition-all"
        >
          Endless Mode
        </Link>
      </div>

      <p className="text-text-secondary text-sm">
        A game by <span className="text-text-primary font-semibold">Two Average Gamers</span>
      </p>
    </div>
  );
}
