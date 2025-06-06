import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareDialog } from '@/components/ShareDialog';
import type { Geocache } from '@/types/geocache';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://treasures.to',
  },
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

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share dialog with correct content', () => {
    render(
      <ShareDialog
        open={true}
        onOpenChange={() => {}}
        geocache={mockGeocache}
      />
    );

    expect(screen.getByText('Share Geocache')).toBeInTheDocument();
    expect(screen.getByText('Share "Test Cache" with others')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/https:\/\/treasures\.to\//)).toBeInTheDocument();
  });

  it('copies link to clipboard when copy button is clicked', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard.writeText = mockWriteText;

    render(
      <ShareDialog
        open={true}
        onOpenChange={() => {}}
        geocache={mockGeocache}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('https://treasures.to/')
      );
    });

    // Check that the button shows "copied" state
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('generates correct naddr URL', () => {
    render(
      <ShareDialog
        open={true}
        onOpenChange={() => {}}
        geocache={mockGeocache}
      />
    );

    const input = screen.getByDisplayValue(/https:\/\/treasures\.to\//);
    const value = input.getAttribute('value') || '';
    expect(value).toContain('naddr1');
    expect(value).toContain('https://treasures.to/');
  });

  it('handles dialog close', () => {
    const onOpenChange = vi.fn();
    
    render(
      <ShareDialog
        open={true}
        onOpenChange={onOpenChange}
        geocache={mockGeocache}
      />
    );

    // Click the close button (X)
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});