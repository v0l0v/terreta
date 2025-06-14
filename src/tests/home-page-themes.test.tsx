import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import Home from '@/pages/Home';
import { BrowserRouter } from 'react-router-dom';
import { NostrLoginProvider } from '@nostrify/react/login';
import NostrProvider from '@/components/NostrProvider';
import { StoreProvider } from '@/shared/stores/StoreProvider';
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const defaultConfig: AppConfig = {
  relayUrl: 'wss://relay.primal.net',
};

const TestWrapper = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: string }) => (
  <BrowserRouter>
    <AppProvider storageKey="test:app-config" defaultConfig={defaultConfig} presetRelays={[]}>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false}
        disableTransitionOnChange
        themes={['light', 'dark', 'system', 'adventure']}
        forcedTheme={theme}
      >
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey='test:nostr:login'>
            <NostrProvider>
              <StoreProvider>
                {children}
              </StoreProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Home Page Theme Support', () => {
  it('should render in light mode', () => {
    render(
      <TestWrapper theme="light">
        <Home />
      </TestWrapper>
    );

    // Check that main content is rendered
    expect(screen.getByText(/Discover Hidden/)).toBeInTheDocument();
    // The number of "Treasures" might change due to dropdown, so we check for at least one
    expect(screen.getAllByText(/Treasures/).length).toBeGreaterThan(0);
  });

  it('should render in dark mode', () => {
    render(
      <TestWrapper theme="dark">
        <Home />
      </TestWrapper>
    );

    // Check that main content is rendered
    expect(screen.getByText(/Discover Hidden/)).toBeInTheDocument();
    expect(screen.getAllByText(/Treasures/).length).toBeGreaterThan(0);
  });

  it('should render in adventure mode', () => {
    render(
      <TestWrapper theme="adventure">
        <Home />
      </TestWrapper>
    );

    // Check that adventure-specific content is rendered
    expect(screen.getByText(/Embark on Epic/)).toBeInTheDocument();
    expect(screen.getByText(/Quests/)).toBeInTheDocument();
  });

  it('should have proper background gradients', () => {
    const { container } = render(
      <TestWrapper theme="light">
        <Home />
      </TestWrapper>
    );

    // Check that the main container has the gradient background class
    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
    expect(mainDiv).toHaveClass('from-green-50/60');
    expect(mainDiv).toHaveClass('dark:from-slate-900/70');
  });

  it('should display globe SVG elements', () => {
    const { container } = render(
      <TestWrapper theme="light">
        <Home />
      </TestWrapper>
    );

    // Check that SVG elements are present
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    
    // Check for path elements (globe lines)
    const pathElements = container.querySelectorAll('path');
    expect(pathElements.length).toBeGreaterThan(0);
  });

  it('should show different icons for different themes', async () => {
    // Light/Dark mode should show Search icon
    const { rerender } = render(
      <TestWrapper theme="light">
        <Home />
      </TestWrapper>
    );

    // Click the dropdown trigger to reveal the menu items
    fireEvent.click(screen.getByRole('button', { name: /explore/i }));
    await waitFor(async () => {
      expect(await screen.findByText(/Start Exploring/)).toBeInTheDocument();
    });

    // Adventure mode should show Compass icon and different text
    rerender(
      <TestWrapper theme="adventure">
        <Home />
      </TestWrapper>
    );

    // Click the dropdown trigger again after rerender
    fireEvent.click(screen.getByRole('button', { name: /explore/i }));
    await waitFor(async () => {
      expect(await screen.findByText(/Reveal Map/)).toBeInTheDocument();
    });
  });
});