import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NRelay1 } from '@nostrify/nostrify';
import type { CreateLogData, GeocacheLog } from '@/types/geocache';
import { 
  NIP_GC_KINDS, 
  buildLogTags, 
  validateLogType,
  type ValidLogType
} from '@/lib/nip-gc';
import { signVerifiedLog } from '@/lib/verification';

interface CreateVerifiedLogData extends CreateLogData {
  verificationKey: string; // nsec for signing
}

export function useCreateVerifiedLog() {
  const queryClient = useQueryClient();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateVerifiedLogData) => {
      console.log('Creating verified log for geocache:', data.geocacheId);
      
      // Validate data
      if (!data.geocacheId) {
        throw new Error('Geocache ID is required');
      }
      if (!data.text?.trim()) {
        throw new Error('Log text is required');
      }
      if (!data.verificationKey) {
        throw new Error('Verification key is required');
      }
      
      // Validate log type according to NIP-GC
      if (!validateLogType(data.type)) {
        throw new Error(`Invalid log type: ${data.type}`);
      }
      
      // Build tags using consolidated utility
      const tags = buildLogTags({
        geocachePubkey: data.geocachePubkey!,
        geocacheDTag: data.geocacheDTag!,
        logType: data.type as ValidLogType,
        images: data.images,
      });
      
      // Add user attribution tag for verified logs
      if (user?.pubkey) {
        tags.push(['p', user.pubkey, '', 'author']);
      }
      
      // Create event template
      const eventTemplate = {
        kind: NIP_GC_KINDS.LOG,
        content: data.text.trim(),
        tags,
      };

      // Sign with verification key
      const signedEvent = signVerifiedLog(data.verificationKey, eventTemplate);
      
      console.log('Signed verified log event:', {
        id: signedEvent.id,
        pubkey: signedEvent.pubkey,
        hasVerificationKey: !!data.verificationKey
      });
      
      // Publish the pre-signed event directly (don't re-sign it!)
      let publishSuccess = false;
      
      // First try to publish to preferred relays if provided
      if (data.preferredRelays && data.preferredRelays.length > 0) {
        console.log('Publishing verified log to preferred relays:', data.preferredRelays);
        
        try {
          const relayPromises = data.preferredRelays.map(async (url) => {
            try {
              const relay = new NRelay1(url);
              await relay.event(signedEvent, { signal: AbortSignal.timeout(5000) });
              console.log(`Successfully published verified log to ${url}`);
              return true;
            } catch (error) {
              console.error(`Failed to publish verified log to ${url}:`, error);
              return false;
            }
          });

          const results = await Promise.allSettled(relayPromises);
          const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
          console.log(`Published verified log to ${successCount}/${data.preferredRelays.length} preferred relays`);
          
          if (successCount > 0) {
            publishSuccess = true;
          }
        } catch (error) {
          console.error('Error publishing to preferred relays:', error);
        }
      }
      
      // Also try to publish to default relays
      try {
        console.log('Publishing verified log to default relays...');
        await nostr.event(signedEvent, { signal: AbortSignal.timeout(10000) });
        console.log('Successfully published verified log to default relays');
        publishSuccess = true;
      } catch (error) {
        console.error('Failed to publish verified log to default relays:', error);
      }
      
      if (!publishSuccess) {
        throw new Error('Failed to publish verified log to any relays. Please check your connection and try again.');
      }
      
      // Try to verify the event was published (but don't fail if verification fails)
      try {
        const verification = await nostr.query([{ ids: [signedEvent.id] }], { 
          signal: AbortSignal.timeout(3000) 
        });
        
        if (verification.length > 0) {
          console.log('Verified log confirmed on relays:', signedEvent.id);
        } else {
          console.warn('Verified log not immediately found on relays, but this is normal');
        }
      } catch (error) {
        console.warn('Could not verify log on relays immediately, but this is normal:', error);
      }
      
      const event = signedEvent; // Use the original signed event

      console.log('Verified log event created:', event.id);
      return event;
    },
    onSuccess: (event, variables) => {
      toast({
        title: "Verified log posted!",
        description: "Your verified log has been added to the geocache.",
      });
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(['geocache-logs', variables.geocacheDTag, variables.geocachePubkey], (oldData: unknown) => {
        // Create a new log entry from our event
        // Extract client and relay info from the event tags
        const clientTag = event.tags.find(t => t[0] === 'client')?.[1];
        const relayTags = event.tags.filter(t => t[0] === 'relay').map(t => t[1]);
        
        const newLog = {
          id: event.id,
          pubkey: event.pubkey,
          created_at: event.created_at,
          geocacheId: variables.geocacheId,
          type: variables.type,
          text: variables.text.trim(),
          images: variables.images || [],
          client: clientTag, // Include the client info
          relays: relayTags, // Include relay tags
          isVerified: true, // Mark as verified
          authorPubkey: user?.pubkey, // The actual user who submitted the log
        };
        
        // Handle the case where oldData might be undefined or an empty array
        const existingLogs = Array.isArray(oldData) ? oldData : [];
        
        // Add to the beginning of the list (newest first) and remove duplicates
        const updatedLogs = [newLog, ...existingLogs.filter((log: { id: string }) => log.id !== event.id)];
        
        console.log('Optimistically updated cache with new verified log:', newLog.id, 'Total logs:', updatedLogs.length);
        return updatedLogs;
      });
      
      // Wait longer for the event to propagate, then do a background refresh
      setTimeout(async () => {
        console.log('Refreshing queries after verified log creation:', {
          dTag: variables.geocacheDTag,
          pubkey: variables.geocachePubkey
        });
        
        // Instead of invalidating, manually refetch and merge results
        const queryKey = ['geocache-logs', variables.geocacheDTag, variables.geocachePubkey];
        const currentData = queryClient.getQueryData(queryKey) as GeocacheLog[] | undefined;
        
        // Refetch the data
        try {
          await queryClient.refetchQueries({ 
            queryKey,
            type: 'active'
          });
          
          // After refetch, merge the data to ensure we don't lose any logs
          const newData = queryClient.getQueryData(queryKey) as GeocacheLog[] | undefined;
          if (currentData && newData) {
            // Create a map of all logs by ID to deduplicate
            const logMap = new Map();
            
            // Add all current logs
            currentData.forEach(log => logMap.set(log.id, log));
            
            // Add all new logs (will update if already exists)
            newData.forEach(log => logMap.set(log.id, log));
            
            // Convert back to array and sort by created_at
            const mergedLogs = Array.from(logMap.values())
              .sort((a, b) => b.created_at - a.created_at);
            
            // Update the cache with merged data
            queryClient.setQueryData(queryKey, mergedLogs);
            
            console.log('Merged logs after refresh:', {
              currentCount: currentData.length,
              newCount: newData.length,
              mergedCount: mergedLogs.length
            });
          }
        } catch (error) {
          console.error('Error refreshing logs:', error);
        }
        
        // Still invalidate the other queries
        queryClient.invalidateQueries({ queryKey: ['geocache', variables.geocacheId] });
        queryClient.invalidateQueries({ queryKey: ['geocaches'] });
      }, 5000);
    },
    onError: (error: unknown) => {
      console.error('Failed to create verified log:', error);
      
      let errorMessage = "Please try again later.";
      const errorObj = error as { message?: string };
      
      if (errorObj.message?.includes('not found on relays')) {
        errorMessage = "Log was created but couldn't be verified. It may appear after a delay.";
      } else if (errorObj.message?.includes('Invalid private key')) {
        errorMessage = "Invalid verification key. Please check the QR code or verification link.";
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
      
      toast({
        title: "Failed to post verified log",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}