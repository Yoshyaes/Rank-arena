/**
 * Layout shell is a no-op now: the WordPress page is the wrapper. Kept as
 * a component so any older imports still resolve, but it just passes children.
 */
export default function Layout({ children }) {
  return children;
}
