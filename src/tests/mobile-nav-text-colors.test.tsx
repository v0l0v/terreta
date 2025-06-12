import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileHeader, MobileBottomNav } from '@/components/MobileNav';

// Mock the theme hook
const mockUseTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock other hooks
vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: null }),
}));

vi.mock('@/features/geocache/hooks/useLoggedInAccounts', () => ({
  useLoggedInAccounts: () => ({
    currentUser: null,
    removeLogin: vi.fn(),
  }),
}));

vi.mock('@/components/auth/LoginArea', () => ({
  LoginArea: () => <div data-testid="login-area">Login</div>,
}));

vi.mock('@/components/OfflineIndicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline</div>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

vi.mock('@/components/RelaySelector', () => ({
  RelaySelector: () => <div data-testid="relay-selector">Relay</div>,
}));

describe('Mobile Navigation Text Colors', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should use correct text colors in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
    });

    renderWithRouter(<MobileBottomNav />);

    // Check that navigation items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();

    // In light mode, text should not have white color classes
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toHaveClass('text-white');
    expect(homeLink).not.toHaveClass('text-stone-200');
  });

  it('should use correct text colors in adventure mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'adventure',
    });

    renderWithRouter(<MobileBottomNav />);

    // Check that navigation items are rendered with adventure labels
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument(); // Adventure mode shows "Hide" instead of "New"

    // Home link is active (current route is "/"), so it should have active color
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('text-amber-200'); // Should use navTextActive for active item
    
    // Map link should be inactive and use muted color
    const mapLink = screen.getByText('Map').closest('a');
    expect(mapLink).toHaveClass('text-stone-300'); // Should use navTextMuted for inactive items
  });

  it('should render mobile header without text color issues', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
    });

    renderWithRouter(<MobileHeader />);

    // Check that header elements are rendered
    expect(screen.getByText('Treasures')).toBeInTheDocument();
    expect(screen.getByTestId('login-area')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should handle theme switching correctly', () => {
    // Start with light mode
    mockUseTheme.mockReturnValue({
      theme: 'light',
    });

    const { rerender } = renderWithRouter(<MobileBottomNav />);
    expect(screen.getByText('New')).toBeInTheDocument();

    // Switch to adventure mode
    mockUseTheme.mockReturnValue({
      theme: 'adventure',
    });

    rerender(
      <BrowserRouter>
        <MobileBottomNav />
      </BrowserRouter>
    );

    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('should use proper contrast colors for accessibility', () => {
    mockUseTheme.mockReturnValue({
      theme: 'adventure',
    });

    renderWithRouter(<MobileBottomNav />);

    // Adventure mode should use stone-300 for inactive items (better contrast than white)
    const claimLink = screen.getByText('Claim').closest('a');
    expect(claimLink).toHaveClass('text-stone-300');
    
    // Should not use pure white text which has poor contrast
    expect(claimLink).not.toHaveClass('text-white');
    
    // Active items should use amber-200 for good contrast
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('text-amber-200');
  });
});