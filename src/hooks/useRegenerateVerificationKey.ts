import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { generateVerificationKeyPair } from '@/lib/verification';
import { TIMEOUTS } from '@/lib/constants';
import type { Geocache } from '@/types/geocache';
import { 
  NIP_GC_KINDS, 
  buildGeocacheTags, 
  parseGeocacheEvent,
  type ValidCacheType,
  type ValidCacheSize
} from '@/lib/nip-gc';

export function useRegenerateVerificationKey(geocache: Geocache | null) {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();

  return useMutation({
    // Add a timeout for the entire mutation
    mutationKey: ['regenerate-verification-key', geocache?.id],
    mutationFn: async () => {
      if (!geocache) {
        throw new Error("No geocache provided");
      }

      // Generate new verification key pair
      const newVerificationKeyPair = await generateVerificationKeyPair();

      // Create updated geocache event with new verification key
      const tags = buildGeocacheTags({
        dTag: geocache.dTag,
        name: geocache.name,
        location: geocache.location,
        difficulty: geocache.difficulty,
        terrain: geocache.terrain,
        size: geocache.size as ValidCacheSize,
        type: geocache.type as ValidCacheType,
        hint: geocache.hint,
        images: geocache.images,
        relays: geocache.relays,
        verificationPubkey: newVerificationKeyPair.publicKey, // New verification key
        hidden: geocache.hidden,
      });

      // Create a new Nostr event (kind 37515) with the new verification key
      const event = await publishEvent({
        kind: NIP_GC_KINDS.GEOCACHE,
        content: geocache.description,
        tags,
      });

      return {
        event,
        verificationKeyPair: newVerificationKeyPair,
      };
    },
    onSuccess: ({ event, verificationKeyPair }) => {
      toast({
        title: "New verification key generated!",
        description: "A new geocache event has been created. All previous QR codes are now invalid.",
      });
      
      // Update the specific geocache in cache
      const eventId = geocache?.id;
      const dTag = geocache?.dTag;
      
      if (eventId) {
        queryClient.setQueryData(['geocache', eventId], (oldData: unknown) => {
          if (!oldData || !geocache) return oldData;
          
          const parsed = parseGeocacheEvent(event);
          if (!parsed) {
            return oldData;
          }
          
          return {
            ...oldData,
            ...parsed,
            // Preserve original foundCount and logCount
            foundCount: (oldData as Geocache).foundCount,
            logCount: (oldData as Geocache).logCount,
          };
        });
      }

      if (dTag) {
        queryClient.setQueryData(['geocache-by-dtag', dTag], (oldData: unknown) => {
          if (!oldData || !geocache) return oldData;
          
          const parsed = parseGeocacheEvent(event);
          if (!parsed) {
            return oldData;
          }
          
          return {
            ...oldData,
            ...parsed,
            // Preserve original foundCount and logCount
            foundCount: (oldData as Geocache).foundCount,
            logCount: (oldData as Geocache).logCount,
          };
        });
      }
      
      // Also update the geocaches list
      queryClient.invalidateQueries({ queryKey: ['geocaches'] });
      
      // Background refresh after a short delay
      setTimeout(() => {
        if (eventId) {
          queryClient.invalidateQueries({ queryKey: ['geocache', eventId] });
          queryClient.invalidateQueries({ queryKey: ['geocache', event.id] });
        }
        if (dTag) {
          queryClient.invalidateQueries({ queryKey: ['geocache-by-dtag', dTag] });
        }
      }, 2000);

      return verificationKeyPair;
    },
    onError: (error: unknown) => {
      let errorMessage = "Please try again later.";
      
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        const errorStr = error.toString();
        if (errorStr.includes("timeout")) {
          errorMessage = "Connection timeout. Please check your internet connection.";
        } else if (errorStr.includes("User rejected")) {
          errorMessage = "You cancelled the event signing.";
        }
      }
      
      toast({
        title: "Failed to regenerate verification key",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}