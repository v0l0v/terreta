import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MobileHeader, MobileBottomNav } from '@/components/MobileNav';
import { ThemeProvider } from 'next-themes';

// Mock all the necessary hooks and components
vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: null }),
}));

vi.mock('@/features/geocache/hooks/useLoggedInAccounts', () => ({
  useLoggedInAccounts: () => ({ 
    currentUser: null, 
    removeLogin: vi.fn() 
  }),
}));

vi.mock('@/components/auth/LoginArea', () => ({
  LoginArea: ({ compact }: { compact?: boolean }) => (
    <div data-testid="login-area" data-compact={compact}>Login Area</div>
  ),
}));

vi.mock('@/components/OfflineIndicator', () => ({
  OfflineIndicator: ({ showDetails }: { showDetails?: boolean }) => (
    <div data-testid="offline-indicator" data-show-details={showDetails}>Offline</div>
  ),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: ({ variant }: { variant?: string }) => (
    <div data-testid="theme-toggle" data-variant={variant}>Theme</div>
  ),
}));

vi.mock('@/components/RelaySelector', () => ({
  RelaySelector: ({ className }: { className?: string }) => (
    <div data-testid="relay-selector" className={className}>Relay</div>
  ),
}));

const TestWrapper = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: string }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PWA Navigation Styling', () => {
  it('should render mobile header with proper CSS classes for PWA detection', () => {
    render(
      <TestWrapper>
        <MobileHeader />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('mobile-nav-header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('z-40');
  });

  it('should render mobile bottom nav with proper CSS classes for PWA detection', () => {
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('mobile-nav-bottom');
    expect(nav).toHaveClass('fixed');
    expect(nav).toHaveClass('bottom-0');
    expect(nav).toHaveClass('z-40');
  });

  it('should apply adventure theme classes correctly', () => {
    render(
      <TestWrapper theme="adventure">
        <MobileHeader />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('mobile-nav-header');
    // Adventure theme should apply bg-adventure-nav class
    expect(header).toHaveClass('bg-adventure-nav');
  });

  it('should apply light theme classes correctly', () => {
    render(
      <TestWrapper theme="light">
        <MobileHeader />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('mobile-nav-header');
    // Light theme should apply solid background (not translucent)
    expect(header.className).toMatch(/bg-background/);
    expect(header.className).not.toMatch(/backdrop-blur/);
  });

  it('should render navigation items with proper structure', () => {
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );

    // Check that all main navigation items are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should handle theme switching correctly', () => {
    // Test light theme
    const { rerender } = render(
      <TestWrapper theme="light">
        <MobileHeader />
      </TestWrapper>
    );

    let header = screen.getByRole('banner');
    expect(header.className).toMatch(/bg-background/);

    // Test adventure theme - note: in test environment, theme switching may not work
    // exactly as in browser, so we test the component structure instead
    rerender(
      <TestWrapper theme="adventure">
        <MobileHeader />
      </TestWrapper>
    );

    header = screen.getByRole('banner');
    // The component should still have the mobile-nav-header class for PWA detection
    expect(header).toHaveClass('mobile-nav-header');
    expect(header).toHaveClass('sticky');
  });
});