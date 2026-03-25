import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const navLinks = [
    { to: '/challenge', label: 'Daily' },
    { to: '/endless', label: 'Endless' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <header className="border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-grotesk text-xl font-bold text-text-primary hover:text-accent-gold transition-colors">
          RANK ARENA
        </Link>

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

        <div className="w-24 flex justify-end">
          {/* Auth button placeholder — Step 14 */}
        </div>
      </div>
    </header>
  );
}
