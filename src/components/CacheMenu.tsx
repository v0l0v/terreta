import { useState } from 'react';
import { MoreVertical, Share2, ExternalLink, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/ShareDialog';
import { geocacheToNaddr } from '@/lib/naddr-utils';
import type { Geocache } from '@/types/geocache';

interface CacheMenuProps {
  geocache: Geocache;
  variant?: 'default' | 'compact';
  className?: string;
}

export function CacheMenu({ geocache, variant = 'default', className }: CacheMenuProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const naddr = geocacheToNaddr(geocache.pubkey, geocache.dTag, geocache.relays);
  const cacheUrl = `${window.location.origin}/${naddr}`;

  const handleViewDetails = () => {
    window.location.href = `/${naddr}`;
  };

  const handleOpenInNewTab = () => {
    window.open(`/${naddr}`, '_blank');
  };

  const handleViewOnMap = () => {
    const mapUrl = `/map?lat=${geocache.location.lat}&lng=${geocache.location.lng}&zoom=16&highlight=${geocache.dTag}&tab=map`;
    window.location.href = mapUrl;
  };

  const buttonSize = variant === 'compact' ? 'sm' : 'icon';
  const iconSize = variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={buttonSize}
            className={className}
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent click handlers
            }}
          >
            <MoreVertical className={iconSize} />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            handleOpenInNewTab();
          }}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            handleViewOnMap();
          }}>
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            setShareDialogOpen(true);
          }}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        geocache={geocache}
      />
    </>
  );
}