# NIP-GC Implementation Summary

This document summarizes the changes made to align our geocaching implementation with the NIP-GC specification.

## Key Changes Made

### 1. Event Kinds
- **Geocache Listings**: Kept `37515` (correct)
- **Geocache Logs**: Changed from `37516` to `7516` (as specified in NIP-GC)

### 2. Cache Types
- **Before**: `traditional`, `multi`, `mystery`, `earth`, `virtual`, `letterbox`, `event`
- **After**: `traditional`, `multi`, `mystery` (only these are supported in NIP-GC)

### 3. Cache Sizes
- **Before**: `micro`, `small`, `regular`, `large`
- **After**: `micro`, `small`, `regular`, `large`, `other` (added `other` as per NIP-GC)

### 4. Log Types
- **Before**: `found`, `dnf`, `note`, `maintenance`, `disabled`, `enabled`, `archived`
- **After**: `found`, `dnf`, `note`, `maintenance`, `archived` (removed `disabled` and `enabled`)

### 5. Tag Structure Changes

#### Geocache Events (Kind 37515)
- **Location**: Changed from `location` tag with "lat,lng" format to `g` tag with geohash
- **Relay Preferences**: Changed from `relay` tags to `r` tags
- **Removed Extra Tags**: Removed non-standard tags like `status`, `published_at`, etc.

#### Log Events (Kind 7516)
- **Simplified Tags**: Removed extra tags like `d`, `published_at`, `g` (location), `relay`
- **Core Tags Only**: Now only uses `a` (geocache reference), `log-type`, and optional `image` tags

### 6. Files Updated

#### Type Definitions
- `src/types/geocache.ts`: Updated type unions for cache types, sizes, and log types

#### Hooks
- `src/hooks/useCreateGeocache.ts`: Updated to use NIP-GC tag structure and validation
- `src/hooks/useCreateLog.ts`: Simplified to use only required NIP-GC tags
- `src/hooks/useGeocacheLogs.ts`: Updated event kind and log type parsing
- `src/hooks/useGeocaches.ts`: Updated to parse geohash instead of location tag
- `src/hooks/useGeocacheByDTag.ts`: Updated to use geohash and correct relay tags
- `src/hooks/useUserGeocaches.ts`: Updated event kinds and type unions
- `src/hooks/useUserFoundCaches.ts`: Updated event kinds and type parsing
- `src/hooks/useNostrSavedCaches.ts`: Updated event kinds and type unions
- `src/hooks/useGeocache.ts`: Updated to parse geohash and use correct event kinds
- `src/hooks/useAdvancedGeocaches.ts`: Updated event kinds and geohash parsing

#### UI Components
- `src/lib/geocache-constants.ts`: Updated cache type and size options
- `src/components/LogsSection.tsx`: Updated log type union
- `src/components/ui/mobile-button-patterns.tsx`: Removed unsupported log types from UI
- `src/components/ui/geocache-card.tsx`: Removed unsupported cache type icons
- `src/components/GeocacheMap.tsx`: Removed unsupported cache type icons and colors
- `src/hooks/useEditGeocache.ts`: Updated to use NIP-GC validation and tag structure

### 7. Geohash Implementation
Added geohash encoding/decoding functions to replace the previous lat/lng coordinate system:
- Geocache creation now generates geohash from coordinates
- Geocache parsing now decodes geohash back to coordinates
- Maintains backward compatibility while following NIP-GC standard

### 8. Validation Updates
- Added validation for cache types (must be traditional, multi, or mystery)
- Added validation for cache sizes (must include 'other' option)
- Added validation for log types (removed disabled/enabled options)

### 9. Backward Compatibility Removal
- **Complete removal of all backward compatibility code**
- Removed all legacy tag parsing (location, lat/lng, type, etc.)
- Removed JSON content parsing fallbacks in `useUserFoundCaches.ts`
- Removed support for old event structures in all parsing functions
- Updated `useUserGeocaches.ts` to use strict NIP-GC parsing
- Updated `useNostrSavedCaches.ts` to use strict NIP-GC parsing
- Updated `useEditGeocache.ts` to use NIP-GC validation and tags
- Removed unsupported cache types from UI components (earth, virtual, letterbox, event)
- Removed unsupported log types from UI (disabled, enabled)
- All parsing functions now strictly follow NIP-GC specification
- Events missing required NIP-GC tags are rejected and ignored

## Compliance with NIP-GC

The implementation now fully complies with the NIP-GC specification:

✅ **Event Kinds**: Uses 37515 for geocaches, 7516 for logs
✅ **Required Tags**: All required tags (d, name, g, difficulty, terrain, size, cache-type) are present
✅ **Optional Tags**: Properly implements hint, image, and r (relay) tags
✅ **Cache Types**: Limited to traditional, multi, mystery as specified
✅ **Log Types**: Uses found, dnf, note, maintenance, archived as specified
✅ **Content Field**: Uses content field for descriptions and log messages
✅ **Geohash**: Uses geohash for location encoding as specified

## Backward Compatibility

**Backward compatibility has been completely removed** to ensure strict NIP-GC compliance:
- Only NIP-GC compliant events will be parsed and displayed
- All legacy tag formats and event structures are rejected
- Events must strictly follow the NIP-GC specification to be recognized

## Testing

All changes have been made to ensure the application strictly adheres to the NIP-GC specification. The implementation will only work with NIP-GC compliant events and relays. Legacy geocache events will be ignored.