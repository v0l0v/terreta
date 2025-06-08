import { render, screen, fireEvent } from '@testing-library/react';
import { PWASettings } from '@/components/PWASettings';

// Mock the hooks
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

const mockUsePWAInstall = {
  installable: false,
  installing: false,
  installed: false,
  install: vi.fn(),
};

vi.mock('@/hooks/usePWAUpdate', () => ({
  usePWAUpdate: () => mockUsePWAUpdate,
}));

vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: () => mockUsePWAInstall,
}));

describe('PWASettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    mockUsePWAUpdate.updateAvailable = false;
    mockUsePWAUpdate.isUpdating = false;
    mockUsePWAUpdate.needsRefresh = false;
    mockUsePWAUpdate.checkingForUpdate = false;
    mockUsePWAInstall.installable = false;
    mockUsePWAInstall.installing = false;
    mockUsePWAInstall.installed = false;
  });

  it('should render app installation section', () => {
    render(<PWASettings />);
    
    expect(screen.getByText('App Installation')).toBeInTheDocument();
    expect(screen.getByText('App installation not available')).toBeInTheDocument();
  });

  it('should render app updates section', () => {
    render(<PWASettings />);
    
    expect(screen.getByText('App Updates')).toBeInTheDocument();
    expect(screen.getByText('Check for the latest app updates')).toBeInTheDocument();
    expect(screen.getByText('Check for Updates')).toBeInTheDocument();
  });

  it('should show install button when app is installable', () => {
    mockUsePWAInstall.installable = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Install the app for a better experience')).toBeInTheDocument();
    expect(screen.getByText('Install App')).toBeInTheDocument();
  });

  it('should show installed badge when app is installed', () => {
    mockUsePWAInstall.installed = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Installed')).toBeInTheDocument();
    expect(screen.getByText('App is installed on your device')).toBeInTheDocument();
  });

  it('should handle install app click', () => {
    mockUsePWAInstall.installable = true;
    
    render(<PWASettings />);
    
    fireEvent.click(screen.getByText('Install App'));
    
    expect(mockUsePWAInstall.install).toHaveBeenCalled();
  });

  it('should show installing state', () => {
    mockUsePWAInstall.installable = true;
    mockUsePWAInstall.installing = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Installing...')).toBeInTheDocument();
  });

  it('should show update available state', () => {
    mockUsePWAUpdate.updateAvailable = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version is available for download')).toBeInTheDocument();
    expect(screen.getByText('Install Update')).toBeInTheDocument();
  });

  it('should show needs refresh state', () => {
    mockUsePWAUpdate.needsRefresh = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Ready to Reload')).toBeInTheDocument();
    expect(screen.getByText('Update installed, reload to apply changes')).toBeInTheDocument();
    expect(screen.getByText('Reload App')).toBeInTheDocument();
  });

  it('should handle check for updates click', () => {
    render(<PWASettings />);
    
    fireEvent.click(screen.getByText('Check for Updates'));
    
    expect(mockUsePWAUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('should handle install update click', () => {
    mockUsePWAUpdate.updateAvailable = true;
    
    render(<PWASettings />);
    
    fireEvent.click(screen.getByText('Install Update'));
    
    expect(mockUsePWAUpdate.applyUpdate).toHaveBeenCalled();
  });

  it('should handle reload app click', () => {
    mockUsePWAUpdate.needsRefresh = true;
    
    render(<PWASettings />);
    
    fireEvent.click(screen.getByText('Reload App'));
    
    expect(mockUsePWAUpdate.reloadApp).toHaveBeenCalled();
  });

  it('should show checking for updates state', () => {
    mockUsePWAUpdate.checkingForUpdate = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('should show updating state', () => {
    mockUsePWAUpdate.updateAvailable = true;
    mockUsePWAUpdate.isUpdating = true;
    
    render(<PWASettings />);
    
    expect(screen.getByText('Installing...')).toBeInTheDocument();
  });
});