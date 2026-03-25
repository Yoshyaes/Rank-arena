export default function ActionButtons({ onHigher, onLower, disabled = false, gameATitle, gameBTitle }) {
  const nameA = gameATitle ? truncate(gameATitle, 18) : 'LEFT';
  const nameB = gameBTitle ? truncate(gameBTitle, 18) : 'RIGHT';

  return (
    <div className="mt-6 max-w-lg mx-auto">
      <p className="text-center text-text-secondary text-sm mb-3">
        Which game has the higher stat? Tap a card or use the buttons below.
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={onHigher}
          disabled={disabled}
          className="flex-1 btn-text py-4 px-3 rounded-full bg-accent-blue text-white
            hover:brightness-110 active:scale-[0.98] transition-all
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
            focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-primary
            text-sm leading-tight"
        >
          {nameA} &uarr;
        </button>
        <button
          onClick={onLower}
          disabled={disabled}
          className="flex-1 btn-text py-4 px-3 rounded-full bg-accent-purple text-white
            hover:brightness-110 active:scale-[0.98] transition-all
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
            focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-bg-primary
            text-sm leading-tight"
        >
          {nameB} &uarr;
        </button>
      </div>
    </div>
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}
