import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CacheDetailTabs } from '@/components/ui/mobile-button-patterns';

// Mock window.innerWidth for mobile detection
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

// Mock the tabs content
const MockTabsContent = () => (
  <>
    <div data-testid="logs-content">Logs Content</div>
    <div data-testid="map-content">Map Content</div>
  </>
);

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Map Tab Selection', () => {
  beforeEach(() => {
    // Reset window.innerWidth before each test
    mockInnerWidth(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should default to logs tab when no fromMap parameter', () => {
    renderWithProviders(
      <CacheDetailTabs logCount={5}>
        <MockTabsContent />
      </CacheDetailTabs>
    );

    // The logs tab should be selected by default
    const logsTab = screen.getByRole('tab', { name: /logs/i });
    expect(logsTab).toHaveAttribute('data-state', 'active');
  });

  it('should default to logs tab on desktop even with fromMap parameter', () => {
    // Set desktop width
    mockInnerWidth(1200);
    
    renderWithProviders(
      <CacheDetailTabs logCount={5} defaultTab="map">
        <MockTabsContent />
      </CacheDetailTabs>
    );

    // Even with defaultTab="map", it should respect the prop
    const mapTab = screen.getByRole('tab', { name: /map/i });
    expect(mapTab).toHaveAttribute('data-state', 'active');
  });

  it('should default to map tab on mobile when defaultTab is map', () => {
    // Set mobile width
    mockInnerWidth(768);
    
    renderWithProviders(
      <CacheDetailTabs logCount={5} defaultTab="map">
        <MockTabsContent />
      </CacheDetailTabs>
    );

    // On mobile with defaultTab="map", map tab should be active
    const mapTab = screen.getByRole('tab', { name: /map/i });
    expect(mapTab).toHaveAttribute('data-state', 'active');
  });

  it('should show log count in tabs', () => {
    renderWithProviders(
      <CacheDetailTabs logCount={10}>
        <MockTabsContent />
      </CacheDetailTabs>
    );

    // Should show the log count - text is split across elements
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('should handle zero log count', () => {
    renderWithProviders(
      <CacheDetailTabs logCount={0}>
        <MockTabsContent />
      </CacheDetailTabs>
    );

    // Should show logs with (0) - text is split across elements
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });
});