import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification';

// Mock the usePWAUpdate hook
const mockUsePWAUpdate = {
  updateAvailable: false,
  isUpdating: false,
  needsRefresh: false,
  checkingForUpdate: false,
  checkForUpdate: vi.fn(),
  applyUpdate: vi.fn(),
  reloadApp: vi.fn(),
  dismissUpdate: vi.fn(),
};

vi.mock('@/hooks/usePWAUpdate', () => ({
  usePWAUpdate: () => mockUsePWAUpdate,
}));

describe('PWAUpdateNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUsePWAUpdate.updateAvailable = false;
    mockUsePWAUpdate.isUpdating = false;
    mockUsePWAUpdate.needsRefresh = false;
    mockUsePWAUpdate.checkingForUpdate = false;
  });

  it('should not show notification when no update is available', () => {
    render(<PWAUpdateNotification />);
    
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
  });

  it('should show notification when update is available', () => {
    mockUsePWAUpdate.updateAvailable = true;
    
    render(<PWAUpdateNotification />);
    
    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version of Treasures is ready to install.')).toBeInTheDocument();
    expect(screen.getByText('Install Update')).toBeInTheDocument();
    expect(screen.getByText('Later')).toBeInTheDocument();
  });

  it('should show reload prompt when update needs refresh', () => {
    mockUsePWAUpdate.needsRefresh = true;
    
    render(<PWAUpdateNotification />);
    
    expect(screen.getByText('Update Ready')).toBeInTheDocument();
    expect(screen.getByText('The app has been updated. Reload to use the new version.')).toBeInTheDocument();
    expect(screen.getByText('Reload App')).toBeInTheDocument();
  });

  it('should handle install update button click', () => {
    mockUsePWAUpdate.updateAvailable = true;
    
    render(<PWAUpdateNotification />);
    
    fireEvent.click(screen.getByText('Install Update'));
    
    expect(mockUsePWAUpdate.applyUpdate).toHaveBeenCalled();
  });

  it('should handle reload button click', () => {
    mockUsePWAUpdate.needsRefresh = true;
    
    render(<PWAUpdateNotification />);
    
    fireEvent.click(screen.getByText('Reload App'));
    
    expect(mockUsePWAUpdate.reloadApp).toHaveBeenCalled();
  });

  it('should show updating state', () => {
    mockUsePWAUpdate.updateAvailable = true;
    mockUsePWAUpdate.isUpdating = true;
    
    render(<PWAUpdateNotification />);
    
    expect(screen.getByText('Installing...')).toBeInTheDocument();
    expect(screen.getByText('Later')).toBeDisabled();
  });

  it('should handle dismiss button click', () => {
    mockUsePWAUpdate.updateAvailable = true;
    
    const { rerender } = render(<PWAUpdateNotification />);
    
    fireEvent.click(screen.getByText('Later'));
    
    // Simulate the component re-rendering with dismissed state
    mockUsePWAUpdate.updateAvailable = false;
    rerender(<PWAUpdateNotification />);
    
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
  });
});