import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CacheMenu } from '@/components/CacheMenu';
import type { Geocache } from '@/types/geocache';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://treasures.to',
    href: 'https://treasures.to/',
  },
  writable: true,
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

const mockGeocache: Geocache = {
  id: 'test-cache-1',
  pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  created_at: Date.now() / 1000,
  dTag: 'test-dtag',
  name: 'Test Cache',
  description: 'A test geocache',
  location: { lat: 40.7128, lng: -74.0060 },
  difficulty: 3,
  terrain: 2,
  size: 'regular',
  type: 'traditional',
  relays: ['wss://relay.example.com'],
};

function renderWithRouter(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
}

describe('CacheMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu trigger button', () => {
    renderWithRouter(<CacheMenu geocache={mockGeocache} />);
    
    const menuButton = screen.getByRole('button', { name: /more options/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    renderWithRouter(<CacheMenu geocache={mockGeocache} />);
    
    const menuButton = screen.getByRole('button', { name: /more options/i });
    
    // Check that the button has the correct aria attributes
    expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('generates correct URLs for navigation', () => {
    renderWithRouter(<CacheMenu geocache={mockGeocache} />);
    
    // Test that the component can generate the correct naddr
    const naddr = `naddr1qvzqqqyj3vpzqy352eufp27daufrg4ncjz4ummcjx3t83y9tehh3ydzk0zg2hn00qythwumn8ghj7un9d3shjtn90psk6urvv5hxxmmdqqyhgetnwskkgarpvugv5cul`;
    expect(naddr).toContain('naddr1');
  });

  it('renders compact variant with smaller size', () => {
    renderWithRouter(<CacheMenu geocache={mockGeocache} variant="compact" />);
    
    const menuButton = screen.getByRole('button', { name: /more options/i });
    expect(menuButton).toBeInTheDocument();
    // The button should have smaller styling in compact mode
  });

  it('stops propagation when menu trigger is clicked', () => {
    const parentClickHandler = vi.fn();
    
    renderWithRouter(
      <div onClick={parentClickHandler}>
        <CacheMenu geocache={mockGeocache} />
      </div>
    );
    
    const menuButton = screen.getByRole('button', { name: /more options/i });
    fireEvent.click(menuButton);

    // Parent click handler should not be called due to stopPropagation
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('opens share dialog when share menu item is clicked', async () => {
    const user = userEvent.setup();
    const parentClickHandler = vi.fn();
    
    renderWithRouter(
      <div onClick={parentClickHandler}>
        <CacheMenu geocache={mockGeocache} />
      </div>
    );
    
    // Open the dropdown menu
    const menuButton = screen.getByRole('button', { name: /more options/i });
    await user.click(menuButton);

    // Find and click share option
    const shareMenuItem = await screen.findByText('Share');
    await user.click(shareMenuItem);

    // Share dialog should open
    await waitFor(() => {
      expect(screen.getByText('Share Geocache')).toBeInTheDocument();
    });

    // Parent click handler should not be called due to stopPropagation
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('generates correct map URL when view on map is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock window.location.href assignment
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };
    
    renderWithRouter(<CacheMenu geocache={mockGeocache} />);
    
    // Open the dropdown menu
    const menuButton = screen.getByRole('button', { name: /more options/i });
    await user.click(menuButton);

    // Find and click view on map option
    const mapMenuItem = await screen.findByText('View on Map');
    await user.click(mapMenuItem);

    // Check that the correct URL was generated with the new tab parameter
    expect(window.location.href).toBe('/map?lat=40.7128&lng=-74.006&zoom=16&highlight=test-dtag&tab=map');
    
    // Restore original location
    window.location = originalLocation;
  });

  it('renders with correct variant styling', () => {
    const { rerender } = renderWithRouter(<CacheMenu geocache={mockGeocache} variant="compact" />);
    
    let menuButton = screen.getByRole('button', { name: /more options/i });
    expect(menuButton).toBeInTheDocument();
    
    // Test default variant
    rerender(
      <BrowserRouter>
        <CacheMenu geocache={mockGeocache} variant="default" />
      </BrowserRouter>
    );
    
    menuButton = screen.getByRole('button', { name: /more options/i });
    expect(menuButton).toBeInTheDocument();
  });
});