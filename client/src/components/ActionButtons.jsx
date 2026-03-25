export default function ActionButtons({ onHigher, onLower, disabled = false }) {
  return (
    <div className="flex gap-3 w-full max-w-lg mx-auto mt-6">
      <button
        onClick={onHigher}
        disabled={disabled}
        className="flex-1 btn-text py-4 rounded-full bg-accent-blue text-white
          hover:brightness-110 active:scale-[0.98] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
          focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-primary"
      >
        HIGHER &uarr;
      </button>
      <button
        onClick={onLower}
        disabled={disabled}
        className="flex-1 btn-text py-4 rounded-full bg-accent-purple text-white
          hover:brightness-110 active:scale-[0.98] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
          focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-bg-primary"
      >
        LOWER &darr;
      </button>
    </div>
  );
}
