import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, loading } = useAuth();

  const navLinks = [
    { to: '/challenge', label: 'Daily' },
    { to: '/endless', label: 'Endless' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <header className="border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="https://twoaveragegamers.com/"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            TAG
          </a>
          <span className="text-border">|</span>
          <Link to="/" className="font-grotesk text-xl font-bold text-text-primary hover:text-accent-gold transition-colors">
            RANK ARENA
          </Link>
        </div>

        <nav className="flex items-center gap-6">
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

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-2">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-border"
                />
              )}
              <span className="text-sm text-text-primary font-medium hidden sm:inline">
                {user.displayName}
              </span>
            </div>
          ) : !loading ? (
            <a
              href="/wp-login.php?redirect_to=/arena/"
              className="text-sm font-semibold text-accent-blue hover:text-text-primary transition-colors"
            >
              Sign In
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
