import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 pb-8">
        {children}
      </main>
    </div>
  );
}
