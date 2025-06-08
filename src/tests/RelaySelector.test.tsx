import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RelaySelector } from '@/components/RelaySelector';
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';
import { ThemeProvider } from 'next-themes';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const defaultConfig: AppConfig = {
  relayUrl: 'wss://ditto.pub/relay',
};

const presetRelays = [
  { url: 'wss://ditto.pub/relay', name: 'Ditto' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
];

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppProvider 
        storageKey="test:app-config" 
        defaultConfig={defaultConfig} 
        presetRelays={presetRelays}
      >
        {children}
      </AppProvider>
    </ThemeProvider>
  );
}

describe('RelaySelector', () => {
  it('renders with default relay selected on both desktop and mobile', () => {
    render(
      <TestWrapper>
        <RelaySelector />
      </TestWrapper>
    );

    // Should show the relay name in both desktop combobox and mobile select
    const relayTexts = screen.getAllByText('Ditto');
    expect(relayTexts.length).toBeGreaterThan(0);
  });

  it('shows relay URL when no preset name matches', () => {
    const customConfig: AppConfig = {
      relayUrl: 'wss://custom.relay.com',
    };

    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <AppProvider 
          storageKey="test:app-config" 
          defaultConfig={customConfig} 
          presetRelays={presetRelays}
        >
          <RelaySelector />
        </AppProvider>
      </ThemeProvider>
    );

    // Should show custom relay URL in both desktop and mobile versions
    const customTexts = screen.getAllByText('custom.relay.com');
    expect(customTexts.length).toBeGreaterThan(0);
  });

  it('shows desktop combobox and mobile select', () => {
    render(
      <TestWrapper>
        <RelaySelector />
      </TestWrapper>
    );

    // Desktop combobox should be hidden on mobile (md:block class)
    const desktopCombobox = screen.getByRole('combobox');
    expect(desktopCombobox.closest('div')).toHaveClass('hidden', 'md:block');

    // Mobile select should be hidden on desktop (md:hidden class)  
    const mobileSelect = screen.getByRole('button');
    expect(mobileSelect.closest('div')).toHaveClass('md:hidden');
  });

  it('mobile select shows custom relay input when "Add custom relay..." is selected', async () => {
    render(
      <TestWrapper>
        <RelaySelector />
      </TestWrapper>
    );

    // Find the mobile select (the button, not the combobox)
    const selectTrigger = screen.getByRole('button');
    fireEvent.click(selectTrigger);

    // Wait for the dropdown to open and find the custom option
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      expect(customOption).toBeInTheDocument();
      fireEvent.click(customOption);
    });

    // Check that the custom input appears
    await waitFor(() => {
      const customInput = screen.getByPlaceholderText('wss://relay.example.com');
      expect(customInput).toBeInTheDocument();
    });
  });

  it('mobile select allows adding a custom relay URL', async () => {
    render(
      <TestWrapper>
        <RelaySelector />
      </TestWrapper>
    );

    // Find the mobile select (the button, not the combobox)
    const selectTrigger = screen.getByRole('button');
    fireEvent.click(selectTrigger);

    // Select custom option
    await waitFor(() => {
      const customOption = screen.getByText('Add custom relay...');
      fireEvent.click(customOption);
    });

    // Enter custom URL
    await waitFor(() => {
      const customInput = screen.getByPlaceholderText('wss://relay.example.com');
      fireEvent.change(customInput, { target: { value: 'custom.relay.com' } });
      
      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);
    });

    // Check that the custom relay is now selected in both versions
    await waitFor(() => {
      const customTexts = screen.getAllByText('custom.relay.com');
      expect(customTexts.length).toBeGreaterThan(0);
    });
  });
});