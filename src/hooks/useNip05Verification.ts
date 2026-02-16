import { useQuery } from '@tanstack/react-query';
import type { Nip05Response, Nip05VerificationResult, Nip05Status } from '@/types/profile';

/**
 * Verify NIP-05 identifier and extract status with enhanced timeout handling
 */
export function useNip05Status(nip05: string | undefined, pubkey: string | undefined): Nip05Status {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['nip05-verification', nip05, pubkey],
    queryFn: async ({ signal }): Promise<Nip05VerificationResult> => {
      if (!nip05 || !pubkey) {
        return { isVerified: false, error: 'Missing NIP-05 or pubkey' };
      }

      const parts = nip05.split('@');
      if (parts.length !== 2) {
        return { isVerified: false, error: 'Invalid NIP-05 format' };
      }

      const [localPart, domain] = parts;

      if (!/^[a-z0-9\-_.]+$/i.test(localPart || '')) {
        return { isVerified: false, error: 'Invalid local part in NIP-05' };
      }

      try {
        const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(localPart || '')}`;

        const response = await fetch(url, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          return {
            isVerified: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        const data: Nip05Response = await response.json();

        if (!data.names || typeof data.names !== 'object') {
          return { isVerified: false, error: 'Invalid response format' };
        }

        const mappedPubkey = data.names[localPart || ''];
        if (!mappedPubkey) {
          return { isVerified: false, error: 'Name not found in mapping' };
        }

        const isVerified = mappedPubkey.toLowerCase() === pubkey.toLowerCase();

        return {
          isVerified,
          error: isVerified ? null : 'Public key mismatch',
          relays: data.relays?.[pubkey] || [],
        };
      } catch (error) {
        const errorObj = error as { message?: string; name?: string };

        if (errorObj.name === 'AbortError') {
          return { isVerified: false, error: 'Request timeout' };
        }

        return {
          isVerified: false,
          error: errorObj.message || 'Network error',
        };
      }
    },
    enabled: Boolean(nip05 && pubkey),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const errorObj = error as { message?: string };
      if (errorObj.message?.includes('Invalid') ||
          errorObj.message?.includes('HTTP 4') ||
          errorObj.message?.includes('timeout') ||
          errorObj.message?.includes('Network error')) {
        return false;
      }
      return failureCount < 1;
    },
    retryDelay: 1000,
  });

  let errorMessage = error || data?.error;
  if (typeof errorMessage === 'object' && errorMessage !== null) {
    errorMessage = (errorMessage as { message?: string }).message || 'Unknown error';
  }

  return {
    isVerified: data?.isVerified || false,
    isLoading,
    error: errorMessage || undefined,
    isError,
    relays: data?.relays || [],
    isTimeout: errorMessage?.includes('timeout') || errorMessage?.includes('Request timeout') || false,
    isNetworkError: errorMessage?.includes('Network error') || errorMessage?.includes('fetch') || false,
    isInvalidFormat: errorMessage?.includes('Invalid') || false,
  };
}
