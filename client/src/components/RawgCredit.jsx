// RAWG's API terms require an attribution link on any page using their data
// or images. Cover art for every matchup comes from RAWG.
export default function RawgCredit() {
  return (
    <p
      className="text-center mt-4 text-tag-text-secondary"
      style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px' }}
    >
      Game data and images via{' '}
      <a
        href="https://rawg.io"
        target="_blank"
        rel="noopener"
        className="text-tag-text-secondary underline"
      >
        RAWG
      </a>
    </p>
  );
}
