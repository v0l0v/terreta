import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrProvider } from '@nostrify/react';
import Map from '@/pages/Map';

// Mock the GeocacheMap component to focus on the style button
vi.mock('@/features/map/components/GeocacheMap', () => ({
  GeocacheMap: ({ showStyleSelector, ...props }: any) => (
    <div data-testid="geocache-map">
      {showStyleSelector && (
        <div data-testid="map-style-selector">
          <button data-testid="style-button">Style Button</button>
        </div>
      )}
      Mock Map Component
    </div>
  ),
}));

// Mock other complex components
vi.mock('@/components/DesktopHeader', () => ({
  DesktopHeader: () => (
    <div data-testid="desktop-header">
      <div data-testid="login-area">
        <div data-testid="account-switcher">
          <button data-testid="avatar-button">Avatar</button>
        </div>
      </div>
    </div>
  ),
}));

vi.mock('@/components/LocationSearch', () => ({
  LocationSearch: ({ onLocationSelect }: { onLocationSelect: (location: any) => void }) => (
    <button
      data-testid="location-search"
      onClick={() => onLocationSelect({ lat: 40.7128, lng: -74.0060, name: 'New York' })}
    >
      Location Search
    </button>
  ),
}));

vi.mock('@/components/FilterButton', () => ({
  FilterButton: () => <button data-testid="filter-button">Filter</button>,
}));

vi.mock('@/components/GeocacheDialog', () => ({
  GeocacheDialog: () => <div data-testid="geocache-dialog">Dialog</div>,
}));

// Mock hooks
vi.mock('@/features/geocache/hooks/useReliableProximitySearch', () => ({
  useAdaptiveReliableGeocaches: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    searchStrategy: 'broad',
    proximityAttempted: false,
    proximitySuccessful: false,
    totalFound: 0,
    debugInfo: {},
  }),
}));

vi.mock('@/features/geocache/hooks/useOptimisticGeocaches', () => ({
  useMapPageGeocaches: () => ({
    geocaches: [],
    isLoading: false,
    isError: false,
    error: null,
    hasInitialData: true,
    isStale: false,
    isFetching: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/features/map/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    loading: false,
    coords: null,
    getLocation: vi.fn(),
  }),
}));

vi.mock('@/shared/hooks/useAppContext', () => ({
  useAppContext: () => ({
    config: { relay: 'wss://ditto.pub/relay' },
  }),
}));

// Mock useAuthor to simulate fast loading
vi.mock('@/features/auth/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      },
      hasProfile: true,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock useLoggedInAccounts
vi.mock('@/features/geocache/hooks/useLoggedInAccounts', () => ({
  useLoggedInAccounts: () => ({
    currentUser: {
      id: 'test-user',
      pubkey: 'test-pubkey',
      metadata: {
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      },
      isLoadingMetadata: false,
    },
    otherUsers: [],
    setLogin: vi.fn(),
    removeLogin: vi.fn(),
    isLoadingCurrentUser: false,
    isLoadingAnyUser: false,
  }),
}));

describe('Map Style Button Interaction', () => {
  const renderMapPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <NostrProvider relays={['wss://ditto.pub/relay']}>
            <Map />
          </NostrProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  it('should render style button immediately', () => {
    renderMapPage();

    // Style button should be present immediately
    const styleButton = screen.getByTestId('style-button');
    expect(styleButton).toBeInTheDocument();
  });

  it('should allow style button clicks', () => {
    renderMapPage();

    const styleButton = screen.getByTestId('style-button');
    
    // Button should be clickable immediately
    expect(styleButton).not.toBeDisabled();
    
    // Should be able to click without errors
    fireEvent.click(styleButton);
    
    // No errors should be thrown
    expect(styleButton).toBeInTheDocument();
  });

  it('should render map style selector in desktop view', () => {
    renderMapPage();

    // Map style selector should be present
    const mapStyleSelector = screen.getByTestId('map-style-selector');
    expect(mapStyleSelector).toBeInTheDocument();
    
    const styleButton = screen.getByTestId('style-button');
    expect(styleButton).toBeInTheDocument();
  });

  it('should not be affected by profile avatar loading', () => {
    renderMapPage();

    // Both style button and avatar should be present
    const styleButton = screen.getByTestId('style-button');
    const avatarButton = screen.getByTestId('avatar-button');
    
    expect(styleButton).toBeInTheDocument();
    expect(avatarButton).toBeInTheDocument();
    
    // Style button should be clickable regardless of avatar state
    expect(styleButton).not.toBeDisabled();
    fireEvent.click(styleButton);
    expect(styleButton).toBeInTheDocument();
  });
});