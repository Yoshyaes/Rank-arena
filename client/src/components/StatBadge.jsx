const STAT_DISPLAY = {
  metacritic: { emoji: '\u{1F4CA}', label: 'Meta' },
  sales_millions: { emoji: '\u{1F4B0}', label: 'Sales' },
  peak_players: { emoji: '\u{1F3AE}', label: 'Players' },
  avg_playtime_hours: { emoji: '\u23F1\uFE0F', label: 'Playtime' },
  user_score: { emoji: '\u2B50', label: 'Score' },
};

export default function StatBadge({ statCategory }) {
  const display = STAT_DISPLAY[statCategory] || { emoji: '?', label: statCategory };

  return (
    <div className="flex items-center justify-center z-10">
      <div className="w-14 h-14 rounded-full bg-bg-surface border-2 border-border flex flex-col items-center justify-center shadow-lg">
        <span className="text-lg leading-none">{display.emoji}</span>
        <span className="text-[10px] font-semibold uppercase text-text-secondary mt-0.5 tracking-wide">
          {display.label}
        </span>
      </div>
    </div>
  );
}
