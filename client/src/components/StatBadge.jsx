const STAT_DISPLAY = {
  metacritic:        { glyph: 'M', label: 'META' },
  sales_millions:    { glyph: '$', label: 'SALES' },
  peak_players:      { glyph: 'P', label: 'PEAK' },
  avg_playtime_hours:{ glyph: 'H', label: 'HOURS' },
  user_score:        { glyph: 'U', label: 'USER' },
};

export default function StatBadge({ statCategory }) {
  const display = STAT_DISPLAY[statCategory] || { glyph: '?', label: 'STAT' };

  return (
    <div className="ra-stat-badge flex items-center justify-center z-10" aria-hidden="true">
      <div
        className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
        style={{
          background: 'var(--tag-surface-midnight)',
          border: '2px solid var(--tag-accent-cyan)',
          boxShadow: '0 0 14px rgba(34, 197, 212, 0.35), inset 0 0 10px rgba(108, 99, 255, 0.15)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--tag-font-display)',
            fontSize: '1.25rem',
            color: 'var(--tag-accent-cyan)',
            lineHeight: 1,
          }}
        >
          {display.glyph}
        </span>
        <span
          className="mt-0.5"
          style={{
            fontFamily: 'var(--tag-font-pixel)',
            fontSize: '0.5rem',
            letterSpacing: '0.05em',
            color: 'var(--tag-text-secondary)',
          }}
        >
          {display.label}
        </span>
      </div>
    </div>
  );
}
