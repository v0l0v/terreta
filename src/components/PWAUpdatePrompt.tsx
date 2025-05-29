import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Download } from 'lucide-react';

// Extend Window interface to include deferredPrompt
declare global {
  interface Window {
    deferredPrompt?: {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
  }
}

export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as unknown as Window['deferredPrompt'];
      setInstallable(true);
    });
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleInstall = async () => {
    const deferredPrompt = window.deferredPrompt;
    if (!deferredPrompt) return;

    setInstalling(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    window.deferredPrompt = undefined;
    setInstallable(false);
    setInstalling(false);
  };

  if (updateAvailable) {
    return (
      <Alert className="fixed bottom-4 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96">
        <RefreshCw className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>New version available!</span>
            <Button size="sm" onClick={handleUpdate}>
              Update
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (installable) {
    return (
      <Alert className="fixed bottom-4 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96">
        <Download className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Install NostrCache app?</span>
            <Button 
              size="sm" 
              onClick={handleInstall}
              disabled={installing}
            >
              {installing ? 'Installing...' : 'Install'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}