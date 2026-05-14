import { Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Challenge from './pages/Challenge';
import Endless from './pages/Endless';
import LeaderboardPage from './pages/LeaderboardPage';

const tabs = [
  { to: '/',            label: 'Daily',     end: true },
  { to: '/endless',     label: 'Endless' },
  { to: '/leaderboard', label: 'Ranks' },
];

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="w-full mx-auto max-w-[1100px] px-3 sm:px-5 pb-40 sm:pb-10">
          <nav
            aria-label="Rank Arena sections"
            className="ra-tab-nav mb-4 flex gap-2"
          >
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => `ra-tab ${isActive ? 'ra-tab-active' : ''}`}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          <Routes>
            <Route path="/" element={<Challenge />} />
            <Route path="/endless" element={<Endless />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/welcome" element={<Home />} />
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
