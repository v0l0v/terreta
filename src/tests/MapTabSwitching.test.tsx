import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapViewTabs } from '@/components/ui/mobile-button-patterns';

// Mock the necessary components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, defaultValue, className }: any) => (
    <div data-testid="tabs" data-value={value} data-default={defaultValue} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, disabled, className }: any) => (
    <button data-testid={`tab-trigger-${value}`} disabled={disabled} className={className}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tab-content-${value}`} className={className}>
      {children}
    </div>
  ),
}));

describe('MapViewTabs', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  it('should render with controlled value', () => {
    const mockOnValueChange = vi.fn();
    
    render(
      <MapViewTabs value="map" onValueChange={mockOnValueChange}>
        <div>Test content</div>
      </MapViewTabs>,
      { wrapper: createWrapper() }
    );

    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-value', 'map');
    
    // Should render List and Map triggers
    expect(screen.getByTestId('tab-trigger-list')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trigger-map')).toBeInTheDocument();
  });

  it('should render with default value when uncontrolled', () => {
    render(
      <MapViewTabs defaultValue="list">
        <div>Test content</div>
      </MapViewTabs>,
      { wrapper: createWrapper() }
    );

    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-default', 'list');
  });

  it('should render tab triggers with correct labels', () => {
    render(
      <MapViewTabs>
        <div>Test content</div>
      </MapViewTabs>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });
});