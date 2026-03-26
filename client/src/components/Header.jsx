import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, loading } = useAuth();

  const navLinks = [
    { to: '/challenge', label: 'Daily' },
    { to: '/endless', label: 'Endless' },
    { to: '/leaderboard', label: 'Board' },
  ];

  return (
    <header className="border-b border-border">
      {/* Top row */}
      <div className="max-w-[1200px] mx-auto px-3 md:px-4 h-12 md:h-16 flex items-center justify-between">
        {/* Left: back + logo */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <a
            href="https://twoaveragegamers.com/"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors shrink-0"
            title="Back to Two Average Gamers"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline text-sm font-semibold">TAG</span>
          </a>
          <span className="text-border hidden sm:inline">|</span>
          <Link to="/" className="font-grotesk text-lg md:text-xl font-bold text-text-primary hover:text-accent-gold transition-colors truncate">
            RANK ARENA
          </Link>
        </div>

        {/* Center: nav links (desktop only) */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
                location.pathname === to
                  ? 'text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: auth */}
        <div className="flex items-center gap-2 shrink-0">
          {!loading && user ? (
            <div className="flex items-center gap-2">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-border"
                />
              )}
              <span className="text-sm text-text-primary font-medium hidden sm:inline max-w-[120px] truncate">
                {user.displayName}
              </span>
            </div>
          ) : !loading ? (
            <a
              href="/wp-login.php?redirect_to=/arena/"
              className="text-xs md:text-sm font-semibold text-accent-blue hover:text-text-primary transition-colors"
            >
              Sign In
            </a>
          ) : null}
        </div>
      </div>

      {/* Bottom row: mobile nav */}
      <nav className="md:hidden flex items-center justify-center gap-6 h-10 border-t border-border/50">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              location.pathname === to
                ? 'text-accent-blue'
                : 'text-text-secondary'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
