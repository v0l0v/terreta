import { useState } from 'react';
import { Bookmark, BookmarkCheck, BookmarkX } from 'lucide-react';
import { CompassSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useSavedCaches } from '@/features/geocache/hooks/useSavedCaches';
import { useToast } from '@/shared/hooks/useToast';
import type { Geocache } from '@/types/geocache';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SaveButtonProps {
  geocache: Geocache;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function SaveButton({
  geocache,
  variant = 'outline',
  size = 'sm',
  showText = true,
  className,
}: SaveButtonProps) {
  const {
    isCacheSaved,
    isCacheSavedOffline,
    toggleSaveCache,
    isNostrEnabled,
  } = useSavedCaches();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const naddr = `${30001}:${geocache.pubkey}:${geocache.dTag}`;
  const isSaved = isCacheSaved(geocache.id, geocache.dTag, geocache.pubkey);
  const isOffline = isCacheSavedOffline(naddr);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isNostrEnabled) {
      toast({
        title: 'Login required',
        description: 'Please log in with your Nostr account to save caches.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await toggleSaveCache(geocache);

      toast({
        title: isSaved
          ? 'Cache removed from saved list'
          : 'Cache saved for later',
        description: isOffline
          ? `"${geocache.name}" has been saved to your device and will be synced when you're back online.`
          : isSaved
          ? `"${geocache.name}" has been removed from your saved caches.`
          : `"${geocache.name}" has been saved to your Nostr profile.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to save cache. Please try again.';
      toast({
        title: 'Error saving cache',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <CompassSpinner size={16} variant="component" />
          {showText && size !== 'icon' && <span className="ml-2">Saving...</span>}
        </>
      );
    }
    if (isOffline) {
      return (
        <>
          <BookmarkX className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">Saved Offline</span>}
        </>
      );
    }
    if (isSaved) {
      return (
        <>
          <BookmarkCheck className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">Saved</span>}
        </>
      );
    }
    return (
      <>
        <Bookmark className="h-4 w-4" />
        {showText && size !== 'icon' && <span className="ml-2">Save</span>}
      </>
    );
  };

  const getTooltipContent = () => {
    if (isOffline) {
      return 'This cache is saved on your device and will be synced when you are online.';
    }
    return isSaved ? 'Remove from saved caches' : 'Save for later';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleToggleSave}
            disabled={isLoading}
            className={className}
          >
            {getButtonContent()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
