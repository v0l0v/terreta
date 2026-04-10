/**
 * Safe Web3 Provider Initializer
 * Captures exceptions if window.ethereum is not injected or fails to initialize.
 */
export const getSafeEthereumProvider = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const { ethereum } = window as any;

    if (!ethereum) {
      // Return null instead of throwing to allow graceful UI handling
      return null;
    }

    return ethereum;
  } catch (error) {
    // Log error for infrastructure monitoring but prevent DOM blocking/crashes
    console.error('[Web3 Infra] Ethereum provider initialization failed:', error);
    return null;
  }
};

/**
 * Example usage with try/catch block for strict initialization
 */
export const initializeWeb3 = async () => {
  const provider = getSafeEthereumProvider();
  
  if (!provider) {
    return { success: false, error: 'Provider not found' };
  }

  try {
    // Request account access if needed
    await provider.request({ method: 'eth_accounts' });
    return { success: true, provider };
  } catch (error: any) {
    console.warn('[Web3 Infra] Provider request rejected or failed:', error.message);
    return { success: false, error: error.message };
  }
};
