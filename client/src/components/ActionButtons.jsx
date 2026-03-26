export default function ActionButtons({ onHigher, onLower, disabled = false, gameATitle, gameBTitle, selectedCard, onConfirm }) {
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
          className={`flex-1 btn-text py-3 md:py-4 px-3 rounded-full text-white
            transition-all text-sm leading-tight
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
            focus:outline-none
            ${selectedCard === 'a' ? 'bg-accent-blue ring-2 ring-accent-blue ring-offset-2 ring-offset-bg-primary brightness-110' : 'bg-accent-blue hover:brightness-110 active:scale-[0.98]'}`}
        >
          {nameA} &uarr;
        </button>
        <button
          onClick={onLower}
          disabled={disabled}
          className={`flex-1 btn-text py-3 md:py-4 px-3 rounded-full text-white
            transition-all text-sm leading-tight
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
            focus:outline-none
            ${selectedCard === 'b' ? 'bg-accent-purple ring-2 ring-accent-purple ring-offset-2 ring-offset-bg-primary brightness-110' : 'bg-accent-purple hover:brightness-110 active:scale-[0.98]'}`}
        >
          {nameB} &uarr;
        </button>
      </div>

      {/* Confirm button — appears on mobile when a card is selected */}
      {selectedCard && onConfirm && (
        <div className="mt-3 md:hidden">
          <button
            onClick={onConfirm}
            className="btn-text w-full py-4 rounded-full bg-accent-win text-white
              hover:brightness-110 active:scale-[0.98] transition-all
              flex items-center justify-center gap-2 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            CONFIRM
          </button>
        </div>
      )}
    </div>
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}
