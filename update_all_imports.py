#!/usr/bin/env python3

import os
import re
import glob

# Define the mapping from old imports to new imports
HOOK_MAPPINGS = {
    "from '@/hooks/useAppContext'": "from '@/shared/hooks/useAppContext'",
    "from '@/hooks/useAsyncAction'": "from '@/shared/hooks/useAsyncAction'",
    "from '@/hooks/useAsyncOperation'": "from '@/shared/hooks/useAsyncOperation'",
    "from '@/hooks/useAuthor'": "from '@/features/auth/hooks/useAuthor'",
    "from '@/hooks/useBatchDeleteGeocaches'": "from '@/features/geocache/hooks/useBatchDeleteGeocaches'",
    "from '@/hooks/useConnectivity'": "from '@/features/offline/hooks/useConnectivity'",
    "from '@/hooks/useCreateGeocache'": "from '@/features/geocache/hooks/useCreateGeocache'",
    "from '@/hooks/useCreateLog'": "from '@/features/logging/hooks/useCreateLog'",
    "from '@/hooks/useCreateVerifiedLog'": "from '@/features/logging/hooks/useCreateVerifiedLog'",
    "from '@/hooks/useCurrentUser'": "from '@/shared/stores/simpleStores'",
    "from '@/hooks/useDataManager'": "from '@/shared/stores/simpleStores'",
    "from '@/hooks/useDeleteGeocache'": "from '@/features/geocache/hooks/useDeleteGeocache'",
    "from '@/hooks/useDeleteLog'": "from '@/features/logging/hooks/useDeleteLog'",
    "from '@/hooks/useDeleteWithConfirmation'": "from '@/shared/hooks/useDeleteWithConfirmation'",
    "from '@/hooks/useEditGeocache'": "from '@/features/geocache/hooks/useEditGeocache'",
    "from '@/hooks/useForm'": "from '@/shared/hooks/useForm'",
    "from '@/hooks/useGeocache'": "from '@/features/geocache/hooks/useGeocache'",
    "from '@/hooks/useGeocacheByNaddr'": "from '@/features/geocache/hooks/useGeocacheByNaddr'",
    "from '@/hooks/useGeocacheLogs'": "from '@/features/geocache/hooks/useGeocacheLogs'",
    "from '@/hooks/useGeocacheNavigation'": "from '@/features/geocache/hooks/useGeocacheNavigation'",
    "from '@/hooks/useGeocacheStats'": "from '@/features/geocache/hooks/useGeocacheStats'",
    "from '@/hooks/useGeocaches'": "from '@/features/geocache/hooks/useGeocaches'",
    "from '@/hooks/useGeolocation'": "from '@/features/map/hooks/useGeolocation'",
    "from '@/hooks/useIsMobile'": "from '@/shared/hooks/useIsMobile'",
    "from '@/hooks/useLocalStorage'": "from '@/shared/hooks/useLocalStorage'",
    "from '@/hooks/useLoggedInAccounts'": "from '@/features/geocache/hooks/useLoggedInAccounts'",
    "from '@/hooks/useLoginActions'": "from '@/features/auth/hooks/useLoginActions'",
    "from '@/hooks/useNip05Verification'": "from '@/features/profile/hooks/useNip05Verification'",
    "from '@/hooks/useNostrPublish'": "from '@/shared/hooks/useNostrPublish'",
    "from '@/hooks/useNostrSavedCaches'": "from '@/features/geocache/hooks/useNostrSavedCaches'",
    "from '@/hooks/useOfflineGeocaches'": "from '@/features/geocache/hooks/useOfflineGeocaches'",
    "from '@/hooks/useOfflineStorage'": "from '@/features/offline/hooks/useOfflineStorage'",
    "from '@/hooks/useOfflineStorageInfo'": "from '@/features/offline/hooks/useOfflineStorageInfo'",
    "from '@/hooks/useOptimisticGeocaches'": "from '@/features/geocache/hooks/useOptimisticGeocaches'",
    "from '@/hooks/usePWAInstall'": "from '@/shared/hooks/usePWAInstall'",
    "from '@/hooks/usePWAUpdate'": "from '@/shared/hooks/usePWAUpdate'",
    "from '@/hooks/useRegenerateVerificationKey'": "from '@/features/geocache/hooks/useRegenerateVerificationKey'",
    "from '@/hooks/useRelayConfig'": "from '@/shared/hooks/useRelayConfig'",
    "from '@/hooks/useRelayStatus'": "from '@/shared/hooks/useRelayStatus'",
    "from '@/hooks/useReliableProximitySearch'": "from '@/features/geocache/hooks/useReliableProximitySearch'",
    "from '@/hooks/useSavedCaches'": "from '@/features/geocache/hooks/useSavedCaches'",
    "from '@/hooks/useTheme'": "from '@/shared/hooks/useTheme'",
    "from '@/hooks/useToast'": "from '@/shared/hooks/useToast'",
    "from '@/hooks/useUploadFile'": "from '@/shared/hooks/useUploadFile'",
    "from '@/hooks/useUserFoundCaches'": "from '@/features/profile/hooks/useUserFoundCaches'",
    "from '@/hooks/useUserGeocaches'": "from '@/features/geocache/hooks/useUserGeocaches'",
    "from '@/hooks/useCacheManager'": "from '@/shared/utils/cacheManager'",
    "from '@/hooks/usePrefetchManager'": "from '@/shared/stores/simpleStores'",
}

LIB_MAPPINGS = {
    "from '@/lib/utils'": "from '@/shared/utils/utils'",
    "from '@/lib/constants'": "from '@/lib/constants'",  # Keep original for now
    "from '@/lib/cacheUtils'": "from '@/shared/utils/cacheUtils'",
    "from '@/lib/cacheConstants'": "from '@/shared/config/cacheConstants'",
    "from '@/lib/cacheIcons'": "from '@/features/geocache/utils/cacheIcons'",  # Updated path
    "from '@/lib/cacheManager'": "from '@/features/geocache/utils/cacheManager'",  # Updated path
    "from '@/lib/connectivityChecker'": "from '@/shared/utils/connectivityChecker'",
    "from '@/lib/coordinates'": "from '@/features/map/utils/coordinates'",
    "from '@/lib/date'": "from '@/shared/utils/date'",
    "from '@/lib/deletionFilter'": "from '@/shared/utils/deletionFilter'",
    "from '@/lib/errorUtils'": "from '@/shared/utils/errorUtils'",
    "from '@/lib/geo'": "from '@/features/map/utils/geo'",
    "from '@/lib/geocache-constants'": "from '@/features/geocache/utils/geocache-constants'",  # Updated path
    "from '@/lib/geocache-utils'": "from '@/features/geocache/utils/geocache-utils'",
    "from '@/lib/ipGeolocation'": "from '@/features/map/utils/ipGeolocation'",
    "from '@/lib/lruCache'": "from '@/shared/utils/lruCache'",
    "from '@/lib/mapIcons'": "from '@/features/map/utils/mapIcons'",
    "from '@/lib/naddr-utils'": "from '@/shared/utils/naddr'",
    "from '@/lib/networkUtils'": "from '@/shared/utils/network'",
    "from '@/lib/nip-gc'": "from '@/features/geocache/utils/nip-gc'",
    "from '@/lib/offlineStorage'": "from '@/features/offline/utils/offlineStorage'",
    "from '@/lib/offlineSync'": "from '@/features/offline/utils/offlineSync'",
    "from '@/lib/osmVerification'": "from '@/features/geocache/utils/osmVerification'",
    "from '@/lib/performance'": "from '@/shared/utils/performance'",
    "from '@/lib/relayConfig'": "from '@/shared/config/relayConfig'",
    "from '@/lib/relays'": "from '@/shared/utils/relays'",
    "from '@/lib/security'": "from '@/shared/utils/security'",
    "from '@/lib/storageConfig'": "from '@/shared/utils/storageConfig'",
    "from '@/lib/validation'": "from '@/shared/utils/validation'",
    "from '@/lib/verification'": "from '@/features/geocache/utils/verification'",
    "from '@/lib/cacheCleanup'": "from '@/features/geocache/utils/cacheCleanup'",  # Added
}

# Special cases
SPECIAL_MAPPINGS = {
    "import { useRelayHealth } from '@/hooks/useRelayStatus'": "import { useRelayHealth } from '@/shared/hooks/useRelayStatus'",
    "import { toast } from '@/hooks/useToast.ts'": "import { toast } from '@/shared/hooks/useToast'",
}

def update_file(filepath):
    """Update imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all mappings
        for old_import, new_import in {**HOOK_MAPPINGS, **LIB_MAPPINGS, **SPECIAL_MAPPINGS}.items():
            content = content.replace(old_import, new_import)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
            return True
        
        return False
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

def main():
    """Update all TypeScript/TSX files in src directory"""
    updated_count = 0
    
    # Find all TypeScript and TSX files
    for pattern in ['src/**/*.ts', 'src/**/*.tsx']:
        for filepath in glob.glob(pattern, recursive=True):
            # Skip the deprecated directories themselves
            if '/hooks/' in filepath or '/lib/' in filepath:
                continue
                
            if update_file(filepath):
                updated_count += 1
    
    print(f"\nCompleted! Updated {updated_count} files.")

if __name__ == "__main__":
    main()