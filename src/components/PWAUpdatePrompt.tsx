import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (updateAvailable) {
    return (
      <Alert className="fixed bottom-4 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <RefreshCw className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">New version available!</span>
            <Button size="sm" onClick={handleUpdate} className="shrink-0">
              Update
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Install prompt is now handled on a dedicated page
  return null;
}