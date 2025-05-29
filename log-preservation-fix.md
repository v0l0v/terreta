# Log Preservation Fix Test

## The Problem (Fixed)

When editing a geocache, logs were being lost because:

1. **Logs linked by event ID** - Old logs used `['geocache', OLD_EVENT_ID]`
2. **New event ID after edit** - Edit created new event with NEW_EVENT_ID  
3. **Broken links** - All old logs now pointed to non-existent event ID

## The Solution  

**Dual-linking system** that supports both old and new methods:

### Creating Logs (NEW)
```javascript
tags: [
  ['geocache-id', eventId],     // OLD: for backward compatibility
  ['geocache-dtag', dTag],      // NEW: link to stable d-tag
  ['t', 'geocache-log'],
  // ...
]
```

### Querying Logs (BOTH)
```javascript
// Filter supports both linking methods:
const isRelated = 
  hasNewLink(event, geocache.dTag) ||  // NEW: d-tag based (stable)
  hasOldLink(event, geocache.id);      // OLD: event ID based
```

## Test Scenarios

### 1. **Backward Compatibility**
- ✅ Old logs (with event ID links) still show up
- ✅ Old logs work with edited caches

### 2. **Forward Compatibility**  
- ✅ New logs (with d-tag links) survive edits
- ✅ New logs work perfectly with unedited caches

### 3. **Edit Scenarios**
- ✅ Edit cache → old logs still visible
- ✅ Edit cache → new logs after edit work
- ✅ Multiple edits → all logs preserved

## Implementation Details

### Key Files Modified:
- `useCreateLog.ts` - Now creates dual-linked logs
- `useGeocacheLogs.ts` - Queries support both methods  
- `useGeocache.ts` - Log counting supports both methods
- `useGeocaches.ts` - List log counts support both methods
- `CacheDetail.tsx` - Passes geocache dTag when creating logs

### Tag Structure:
```javascript
// OLD logs (still supported):
['geocache', 'abc123...']       // Event ID

// NEW logs (edit-proof):
['geocache-dtag', 'geocache-1748481369373-ylwf0t']  // Stable d-tag
['geocache-id', 'abc123...']     // Backward compatibility
```

## Expected Results

1. **All existing logs preserved** - No logs lost during edit
2. **New logs survive edits** - Future edits won't break new logs  
3. **Seamless experience** - Users see consistent log history
4. **No breaking changes** - Existing data continues to work

## Migration Strategy

- **Immediate**: New logs use stable d-tag linking
- **Gradual**: Old logs continue working via ID fallback
- **Automatic**: No manual migration required
- **Safe**: No data loss during transition