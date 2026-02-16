import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from 'zustand';
import { Navigation, User, ChevronRight, Zap, Bookmark, BookmarkCheck, MapPin, Trophy, X as XIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeocacheLogs } from "../hooks/useGeocacheLogs";
import { useZapStore } from "@/stores/useZapStore";
import { ZapButton } from "@/components/ZapButton";
import { useSavedCaches } from "../hooks/useSavedCaches";
import { useToast } from "@/hooks/useToast";

import { useAuthor } from "@/hooks/useAuthor";
import { formatDistanceToNow } from "@/utils/date";
import { useNavigate } from "react-router-dom";
import { geocacheToNaddr } from "@/utils/naddr";
import { getTypeLabel, getSizeLabel } from "../utils/geocache-utils";
import type { Geocache, GeocacheLog } from "@/types/geocache";

import { ImageGallery } from "@/components/ImageGallery";
import { ProfileDialog } from "@/components/ProfileDialog";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface GeocacheDialogProps {
  geocache: Geocache | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeocacheDialog({ geocache, isOpen, onOpenChange }: GeocacheDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCacheSaved, toggleSaveCache, isNostrEnabled } = useSavedCaches();

  // All hooks called unconditionally before any early return
  const { data: logsData = {} } = useGeocacheLogs(
    geocache ? `${geocache.pubkey}:${geocache.dTag}` : '', 
    geocache?.dTag,
    geocache?.pubkey,
    geocache?.relays,
    geocache?.verificationPubkey,
    geocache?.kind || 37516
  );
  
  const logs: GeocacheLog[] = useMemo(() => Array.isArray(logsData) ? logsData : [], [logsData]);
  const author = useAuthor(geocache?.pubkey || "");
  const naddr = geocache ? geocacheToNaddr(geocache.pubkey, geocache.dTag, geocache.relays, geocache.kind || 37516) : "";
  const zapStoreKey = naddr ? `naddr:${naddr}` : `event:${geocache?.id}`;
  const zapTotal = useStore(useZapStore, (state) => state.zapTotals[zapStoreKey] ?? 0);

  // Get the most recent log's author - must be called before early return
  const recentLog = logs[0];
  const recentLogAuthor = useAuthor(recentLog?.pubkey || "");

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfilePubkey, setSelectedProfilePubkey] = useState<string | null>(null);

  // Early return after all hooks
  if (!geocache) return null;

  const totalSats = geocache.zapTotal ?? zapTotal;
  const authorName = author.data?.metadata?.name || geocache.pubkey.slice(0, 8);
  const profilePicture = author.data?.metadata?.picture;
  const findCount = logs.filter(log => log.type === "found").length;
  const dnfCount = logs.filter(log => log.type === "dnf").length;
  const hasImages = geocache.images && geocache.images.length > 0;
  const saved = isCacheSaved(geocache.id, geocache.dTag, geocache.pubkey);
  const recentLogAuthorName = recentLogAuthor.data?.metadata?.name || recentLog?.pubkey?.slice(0, 8) || "";

  const handleViewFullDetails = () => {
    onOpenChange(false);
    navigate(`/${geocacheToNaddr(geocache.pubkey, geocache.dTag, geocache.relays, geocache.kind || 37516)}?fromMap=true`);
  };

  const handleImageClick = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleProfileClick = (pubkey: string) => {
    setSelectedProfilePubkey(pubkey);
    setProfileDialogOpen(true);
  };

  const handleSaveToggle = async () => {
    if (!isNostrEnabled) {
      toast({
        title: t('geocacheDialog.toast.loginRequired.title'),
        description: t('geocacheDialog.toast.loginRequired.description'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await toggleSaveCache(geocache);
      toast({
        title: saved ? t('geocacheDialog.toast.removed.title') : t('geocacheDialog.toast.saved.title'),
        description: saved 
          ? t('geocacheDialog.toast.removed.description', { name: geocache.name })
          : t('geocacheDialog.toast.saved.description', { name: geocache.name }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('geocacheDialog.toast.error.description');
      toast({
        title: t('geocacheDialog.toast.error.title'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'found': return <Trophy className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />;
      case 'dnf': return <XIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
      default: return <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden rounded-xl">
          <DialogTitle className="sr-only">{geocache.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {geocache.description?.slice(0, 100) || `Geocache: ${geocache.name}`}
          </DialogDescription>

          {/* Hero area */}
          {hasImages ? (
            <div className="relative h-40 w-full bg-muted overflow-hidden">
              <img
                src={geocache.images![0]}
                alt={geocache.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleImageClick(0)}
              />
              {geocache.images!.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  +{geocache.images!.length - 1} more
                </div>
              )}
            </div>
          ) : (
            <div className="h-20 w-full bg-gradient-to-br from-muted to-muted/30 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title + attributes */}
            <div>
              <h3 className="font-semibold text-base leading-snug pr-6">{geocache.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                <span className="font-medium bg-muted rounded px-1 py-px">D{geocache.difficulty}</span>
                <span className="font-medium bg-muted rounded px-1 py-px">T{geocache.terrain}</span>
                <span className="mx-0.5">·</span>
                <span>{getSizeLabel(geocache.size)}</span>
                <span className="mx-0.5">·</span>
                <span>{getTypeLabel(geocache.type)}</span>
              </div>
            </div>

            {/* Author + meta */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleProfileClick(geocache.pubkey)}
                className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={authorName}
                    className="h-7 w-7 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ring-1 ring-border">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <span className="text-sm font-medium truncate block leading-tight hover:underline">{authorName}</span>
                  <span className="text-[11px] text-muted-foreground leading-none">
                    {formatDistanceToNow(new Date(geocache.created_at * 1000), { addSuffix: true })}
                  </span>
                </div>
              </button>
              
              <div className="ml-auto flex items-center gap-2.5 text-xs text-muted-foreground flex-shrink-0">
                {findCount > 0 && (
                  <span className="flex items-center gap-0.5" title={`${findCount} find${findCount !== 1 ? 's' : ''}`}>
                    <Trophy className="h-3.5 w-3.5 text-green-600" />
                    <span>{findCount}</span>
                  </span>
                )}
                {dnfCount > 0 && (
                  <span className="flex items-center gap-0.5" title={`${dnfCount} DNF`}>
                    <XIcon className="h-3.5 w-3.5 text-red-500" />
                    <span>{dnfCount}</span>
                  </span>
                )}
                {totalSats > 0 && (
                  <span className="flex items-center gap-0.5" title={`${totalSats.toLocaleString()} sats`}>
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>{totalSats >= 1000 ? `${(totalSats / 1000).toFixed(1)}k` : totalSats}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Description - truncated */}
            {geocache.description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                {geocache.description}
              </p>
            )}

            {/* Recent activity teaser */}
            {recentLog && (
              <button 
                onClick={handleViewFullDetails}
                className="flex items-start gap-2 w-full bg-muted/40 hover:bg-muted/70 transition-colors rounded-lg px-3 py-2 text-left"
              >
                {getLogTypeIcon(recentLog.type)}
                <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                  <span className="font-medium text-foreground">{recentLogAuthorName}</span>
                  {" — "}
                  {recentLog.text 
                    ? recentLog.text.replace(/nostr:\w+/g, '').trim().slice(0, 80)
                    : recentLog.type === 'found' ? 'found this cache' : 'logged this cache'
                  }
                </p>
                {logs.length > 1 && (
                  <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5">
                    +{logs.length - 1}
                  </span>
                )}
              </button>
            )}

            {/* Coordinates */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono">
              <MapPin className="h-3 w-3" />
              {geocache.location.lat.toFixed(5)}, {geocache.location.lng.toFixed(5)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-700 text-white"
                onClick={handleViewFullDetails}
              >
                {t('geocacheDialog.actions.viewFullDetails')}
                <ChevronRight className="h-4 w-4 ml-0.5 -mr-1" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
                onClick={() => {
                  window.open(
                    `https://www.openstreetmap.org/directions?from=&to=${geocache.location.lat}%2C${geocache.location.lng}#map=15/${geocache.location.lat}/${geocache.location.lng}`,
                    "_blank"
                  );
                }}
                title={t('cacheDetail.details.getDirections')}
              >
                <Navigation className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
                onClick={handleSaveToggle}
                title={saved ? t('geocacheDialog.actions.removeFromSaved') : t('geocacheDialog.actions.saveForLater')}
              >
                {saved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>

              <ZapButton
                target={geocache}
                className="h-9 w-9 p-0 flex-shrink-0"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {geocache.images && (
        <ImageGallery
          images={geocache.images}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          initialIndex={galleryIndex}
        />
      )}
      
      <ProfileDialog
        pubkey={selectedProfilePubkey}
        isOpen={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
}
