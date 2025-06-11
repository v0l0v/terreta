#!/bin/bash

# Script to update all imports from old paths to new feature-based paths

echo "Updating imports from @/hooks/* to new paths..."

# Hook mappings
sed -i "s|from '@/hooks/useAppContext'|from '@/shared/hooks/useAppContext'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useAsyncAction'|from '@/shared/hooks/useAsyncAction'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useAsyncOperation'|from '@/shared/hooks/useAsyncOperation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useAuthor'|from '@/features/auth/hooks/useAuthor'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useBatchDeleteGeocaches'|from '@/features/geocache/hooks/useBatchDeleteGeocaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useConnectivity'|from '@/features/offline/hooks/useConnectivity'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useCreateGeocache'|from '@/features/geocache/hooks/useCreateGeocache'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useCreateLog'|from '@/features/logging/hooks/useCreateLog'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useCreateVerifiedLog'|from '@/features/logging/hooks/useCreateVerifiedLog'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useCurrentUser'|from '@/shared/stores/simpleStores'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useDataManager'|from '@/shared/stores/simpleStores'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useDeleteGeocache'|from '@/features/geocache/hooks/useDeleteGeocache'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useDeleteLog'|from '@/features/logging/hooks/useDeleteLog'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useDeleteWithConfirmation'|from '@/shared/hooks/useDeleteWithConfirmation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useEditGeocache'|from '@/features/geocache/hooks/useEditGeocache'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useForm'|from '@/shared/hooks/useForm'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocache'|from '@/features/geocache/hooks/useGeocache'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocacheByNaddr'|from '@/features/geocache/hooks/useGeocacheByNaddr'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocacheLogs'|from '@/features/geocache/hooks/useGeocacheLogs'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocacheNavigation'|from '@/features/geocache/hooks/useGeocacheNavigation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocacheStats'|from '@/features/geocache/hooks/useGeocacheStats'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeocaches'|from '@/features/geocache/hooks/useGeocaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useGeolocation'|from '@/features/map/hooks/useGeolocation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useIsMobile'|from '@/shared/hooks/useIsMobile'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useLocalStorage'|from '@/shared/hooks/useLocalStorage'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useLoggedInAccounts'|from '@/features/geocache/hooks/useLoggedInAccounts'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useLoginActions'|from '@/features/auth/hooks/useLoginActions'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useNip05Verification'|from '@/features/profile/hooks/useNip05Verification'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useNostrPublish'|from '@/shared/hooks/useNostrPublish'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useNostrSavedCaches'|from '@/features/geocache/hooks/useNostrSavedCaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useOfflineGeocaches'|from '@/features/geocache/hooks/useOfflineGeocaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useOfflineStorage'|from '@/features/offline/hooks/useOfflineStorage'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useOfflineStorageInfo'|from '@/features/offline/hooks/useOfflineStorageInfo'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useOptimisticGeocaches'|from '@/features/geocache/hooks/useOptimisticGeocaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/usePWAInstall'|from '@/shared/hooks/usePWAInstall'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/usePWAUpdate'|from '@/shared/hooks/usePWAUpdate'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useRegenerateVerificationKey'|from '@/features/geocache/hooks/useRegenerateVerificationKey'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useRelayConfig'|from '@/shared/hooks/useRelayConfig'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useRelayStatus'|from '@/shared/hooks/useRelayStatus'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useReliableProximitySearch'|from '@/features/geocache/hooks/useReliableProximitySearch'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useSavedCaches'|from '@/features/geocache/hooks/useSavedCaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useTheme'|from '@/shared/hooks/useTheme'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useToast'|from '@/shared/hooks/useToast'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useUploadFile'|from '@/shared/hooks/useUploadFile'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useUserFoundCaches'|from '@/features/profile/hooks/useUserFoundCaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/hooks/useUserGeocaches'|from '@/features/geocache/hooks/useUserGeocaches'|g" src/**/*.{ts,tsx} 2>/dev/null || true

echo "Updating imports from @/lib/* to new paths..."

# Lib mappings
sed -i "s|from '@/lib/utils'|from '@/shared/utils/utils'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/constants'|from '@/shared/config/constants'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/cacheUtils'|from '@/shared/utils/cacheUtils'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/cacheConstants'|from '@/shared/config/cacheConstants'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/cacheIcons'|from '@/shared/components/cacheIcons'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/cacheManager'|from '@/shared/utils/cacheManager'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/connectivityChecker'|from '@/shared/utils/connectivityChecker'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/coordinates'|from '@/features/map/utils/coordinates'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/date'|from '@/shared/utils/date'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/deletionFilter'|from '@/shared/utils/deletionFilter'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/errorUtils'|from '@/shared/utils/errorUtils'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/geo'|from '@/features/map/utils/geo'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/geocache-constants'|from '@/features/geocache/config/geocache-constants'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/geocache-utils'|from '@/features/geocache/utils/geocache-utils'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/ipGeolocation'|from '@/features/map/utils/ipGeolocation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/lruCache'|from '@/shared/utils/lruCache'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/mapIcons'|from '@/features/map/utils/mapIcons'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/naddr-utils'|from '@/shared/utils/naddr'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/networkUtils'|from '@/shared/utils/network'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/nip-gc'|from '@/features/geocache/utils/nip-gc'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/offlineStorage'|from '@/features/offline/utils/offlineStorage'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/offlineSync'|from '@/features/offline/utils/offlineSync'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/osmVerification'|from '@/features/geocache/utils/osmVerification'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/performance'|from '@/shared/utils/performance'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/relayConfig'|from '@/shared/config/relayConfig'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/relays'|from '@/shared/utils/relays'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/security'|from '@/shared/utils/security'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/storageConfig'|from '@/shared/utils/storageConfig'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/validation'|from '@/shared/utils/validation'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|from '@/lib/verification'|from '@/features/geocache/utils/verification'|g" src/**/*.{ts,tsx} 2>/dev/null || true

echo "Updating import statements (import ... from)..."

# Handle import statements
sed -i "s|import { useRelayHealth } from '@/hooks/useRelayStatus'|import { useRelayHealth } from '@/shared/hooks/useRelayStatus'|g" src/**/*.{ts,tsx} 2>/dev/null || true
sed -i "s|import { toast } from '@/hooks/useToast.ts'|import { toast } from '@/shared/hooks/useToast'|g" src/**/*.{ts,tsx} 2>/dev/null || true

echo "Import updates completed!"