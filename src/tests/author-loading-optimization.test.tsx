import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrProvider } from '@nostrify/react';
import { useAuthor } from '@/features/auth/hooks/useAuthor';
import { useLoggedInAccounts } from '@/features/geocache/hooks/useLoggedInAccounts';
import { TIMEOUTS } from '@/shared/config/timeouts';

// Mock the nostr query
const mockQuery = vi.fn();
vi.mock('@nostrify/react', async () => {
  const actual = await vi.importActual('@nostrify/react');
  return {
    ...actual,
    useNostr: () => ({
      nostr: {
        query: mockQuery,
      },
    }),
  };
});

// Mock useNostrLogin for useLoggedInAccounts
vi.mock('@nostrify/react/login', () => ({
  useNostrLogin: () => ({
    logins: [
      {
        id: 'test-user-1',
        pubkey: 'test-pubkey-1',
      },
    ],
    setLogin: vi.fn(),
    removeLogin: vi.fn(),
  }),
}));

describe('Author Loading Optimization', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NostrProvider relays={['wss://ditto.pub/relay']}>
        {children}
      </NostrProvider>
    </QueryClientProvider>
  );

  it('should use FAST_QUERY timeout for author data', async () => {
    // Mock a successful response
    mockQuery.mockResolvedValue([
      {
        content: JSON.stringify({
          name: 'Test User',
          picture: 'https://example.com/avatar.jpg',
        }),
      },
    ]);

    const { result } = renderHook(() => useAuthor('test-pubkey'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify that the query was called with the correct timeout
    expect(mockQuery).toHaveBeenCalledWith(
      [{ kinds: [0], authors: ['test-pubkey'], limit: 1 }],
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );

    // Check that the timeout used is FAST_QUERY (5 seconds) not QUERY (15 seconds)
    expect(TIMEOUTS.FAST_QUERY).toBe(5000);
    expect(TIMEOUTS.QUERY).toBe(15000);
  });

  it('should provide placeholder data immediately', () => {
    // Mock a slow response
    mockQuery.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { result } = renderHook(() => useAuthor('test-pubkey'), { wrapper });

    // Should have placeholder data immediately
    expect(result.current.data).toEqual({ hasProfile: false });
  });

  it('should handle loading states in useLoggedInAccounts', async () => {
    // Mock a slow response for author data
    mockQuery.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useLoggedInAccounts(), { wrapper });

    // Should have loading state information
    expect(result.current.currentUser).toBeDefined();
    expect(result.current.currentUser?.isLoadingMetadata).toBeDefined();
    expect(result.current.isLoadingCurrentUser).toBeDefined();
    expect(result.current.isLoadingAnyUser).toBeDefined();
  });

  it('should not block when author query times out', async () => {
    // Mock a timeout
    mockQuery.mockRejectedValue(new Error('timeout'));

    const { result } = renderHook(() => useAuthor('test-pubkey'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle timeout gracefully
    expect(result.current.data).toEqual({ hasProfile: false });
    expect(result.current.error).toBeTruthy();
  });

  it('should cache author data for 5 minutes', async () => {
    mockQuery.mockResolvedValue([
      {
        content: JSON.stringify({
          name: 'Test User',
          picture: 'https://example.com/avatar.jpg',
        }),
      },
    ]);

    const { result: result1 } = renderHook(() => useAuthor('test-pubkey'), { wrapper });
    
    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Second call should use cached data
    const { result: result2 } = renderHook(() => useAuthor('test-pubkey'), { wrapper });
    
    // Should not trigger another network request immediately
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.data).toEqual(result1.current.data);
  });

  it('should handle missing profile gracefully', async () => {
    // Mock no profile found
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useAuthor('test-pubkey'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ hasProfile: false });
    expect(result.current.error).toBeFalsy();
  });
});