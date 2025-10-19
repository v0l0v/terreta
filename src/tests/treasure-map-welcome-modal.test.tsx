import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreasureMapWelcomeModal } from '@/components/TreasureMapWelcomeModal';

describe('TreasureMapWelcomeModal', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render the modal when user has not seen it before', async () => {
    render(<TreasureMapWelcomeModal />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    // Check for key content
    expect(screen.getByText(/brave adventurer/i)).toBeInTheDocument();
    expect(screen.getByText(/Texas Renaissance Festival/i)).toBeInTheDocument();
    expect(screen.getByText(/Begin the Adventure/i)).toBeInTheDocument();
  });

  it('should not render the modal when user has seen it before', () => {
    localStorage.setItem('treasures_trf_welcome_seen', 'true');
    
    render(<TreasureMapWelcomeModal />);

    expect(screen.queryByText('You Found a Treasure Map!')).not.toBeInTheDocument();
  });

  it('should close the modal and set localStorage when "Begin the Adventure" is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(<TreasureMapWelcomeModal onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    const button = screen.getByText(/Begin the Adventure/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByText('You Found a Treasure Map!')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem('treasures_trf_welcome_seen')).toBe('true');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close the modal when X button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<TreasureMapWelcomeModal />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('You Found a Treasure Map!')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem('treasures_trf_welcome_seen')).toBe('true');
  });

  it('should display all key features', async () => {
    render(<TreasureMapWelcomeModal />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    // Check for feature cards
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText('Quest & Discover')).toBeInTheDocument();

    // Check for mystical messaging
    expect(screen.getByText(/mystical discovery awaits/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Quest Begins Now!/i)).toBeInTheDocument();
  });

  it('should mention Nostr in the footer', async () => {
    render(<TreasureMapWelcomeModal />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    expect(screen.getByText(/Nostr/i)).toBeInTheDocument();
    expect(screen.getByText(/No account needed/i)).toBeInTheDocument();
  });

  it('should have adventure/mystical themed elements', async () => {
    render(<TreasureMapWelcomeModal />);

    await waitFor(() => {
      expect(screen.getByText('You Found a Treasure Map!')).toBeInTheDocument();
    });

    // Check for medieval/adventure themed language
    expect(screen.getByText(/brave adventurer/i)).toBeInTheDocument();
    expect(screen.getByText(/hallowed festival lands/i)).toBeInTheDocument();
    expect(screen.getByText(/realm/i)).toBeInTheDocument();
  });
});
