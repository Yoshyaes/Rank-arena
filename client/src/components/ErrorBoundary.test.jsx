import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ThrowingChild({ shouldThrow }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    // Suppress console.error from React's error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should show refresh button that reloads the page', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(reloadMock).toHaveBeenCalled();
    spy.mockRestore();
  });
});
