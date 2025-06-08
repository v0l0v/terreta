import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RelayCombobox } from '@/components/RelayCombobox';
import { AppContext, type AppContextType } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/ThemeProvider';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

const mockUpdateConfig = vi.fn();

const createMockContext = (relayUrl = 'wss://relay.primal.net'): AppContextType => ({
  config: { relayUrl },
  updateConfig: mockUpdateConfig,
  presetRelays: [
    { url: 'wss://relay.primal.net', name: 'Primal' },
    { url: 'wss://ditto.pub/relay', name: 'Ditto' },
    { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
    { url: 'wss://relay.damus.io', name: 'Damus' },
  ],
});

const renderWithContext = (contextValue: AppContextType) => {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppContext.Provider value={contextValue}>
        <RelayCombobox />
      </AppContext.Provider>
    </ThemeProvider>
  );
};

describe('RelayCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default selected relay', () => {
    const context = createMockContext();
    renderWithContext(context);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Primal')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      expect(screen.getByPlaceholder('Search relays...')).toBeInTheDocument();
    });
  });

  it('displays preset relays in dropdown', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      expect(screen.getByText('Primal')).toBeInTheDocument();
      expect(screen.getByText('Ditto')).toBeInTheDocument();
      expect(screen.getByText('Nostr.Band')).toBeInTheDocument();
      expect(screen.getByText('Damus')).toBeInTheDocument();
      expect(screen.getByText('Add custom relay...')).toBeInTheDocument();
    });
  });

  it('selects a preset relay', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const nostrbandOption = screen.getByText('Nostr.Band');
      fireEvent.click(nostrbandOption);
    });
    
    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the updater function
    const updaterFn = mockUpdateConfig.mock.calls[0][0];
    const result = updaterFn({ relayUrl: 'wss://relay.primal.net' });
    expect(result).toEqual({ relayUrl: 'wss://relay.nostr.band' });
  });

  it('shows custom input when "Add custom relay" is selected', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholder('wss://relay.example.com')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('adds a custom relay with valid URL', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const input = await screen.findByPlaceholder('wss://relay.example.com');
    fireEvent.change(input, { target: { value: 'relay.custom.com' } });
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the updater function
    const updaterFn = mockUpdateConfig.mock.calls[0][0];
    const result = updaterFn({ relayUrl: 'wss://relay.primal.net' });
    expect(result).toEqual({ relayUrl: 'wss://relay.custom.com' });
  });

  it('normalizes custom relay URL by adding wss:// prefix', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const input = await screen.findByPlaceholder('wss://relay.example.com');
    fireEvent.change(input, { target: { value: 'relay.custom.com' } });
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    const updaterFn = mockUpdateConfig.mock.calls[0][0];
    const result = updaterFn({ relayUrl: 'wss://relay.primal.net' });
    expect(result.relayUrl).toBe('wss://relay.custom.com');
  });

  it('disables add button for invalid URLs', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const input = await screen.findByPlaceholder('wss://relay.example.com');
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    
    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  it('cancels custom input', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const cancelButton = await screen.findByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholder('wss://relay.example.com')).not.toBeInTheDocument();
    });
  });

  it('shows remove button for custom relay', () => {
    const context = createMockContext('wss://custom.relay.com');
    renderWithContext(context);
    
    expect(screen.getByText('custom.relay.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('removes custom relay when remove button is clicked', () => {
    const context = createMockContext('wss://custom.relay.com');
    renderWithContext(context);
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the updater function
    const updaterFn = mockUpdateConfig.mock.calls[0][0];
    const result = updaterFn({ relayUrl: 'wss://custom.relay.com' });
    expect(result).toEqual({ relayUrl: '' });
  });

  it('handles keyboard navigation in custom input', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const input = await screen.findByPlaceholder('wss://relay.example.com');
    fireEvent.change(input, { target: { value: 'relay.test.com' } });
    
    // Test Enter key
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockUpdateConfig).toHaveBeenCalled();
  });

  it('handles escape key in custom input', async () => {
    const context = createMockContext();
    renderWithContext(context);
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });
    
    const input = await screen.findByPlaceholder('wss://relay.example.com');
    fireEvent.change(input, { target: { value: 'some-text' } });
    
    // Test Escape key
    fireEvent.keyDown(input, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByPlaceholder('wss://relay.example.com')).not.toBeInTheDocument();
    });
  });
});