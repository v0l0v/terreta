# Migration Guide: Using New Utilities and Patterns

This guide helps you migrate existing components to use the new utilities and patterns we've created.

## 1. Migrating Nostr Queries

### Before (Old Pattern)
```typescript
import { isSafari, createSafariNostr } from '@/lib/safariNostr';

// Lots of duplicate Safari handling code
if (isSafari()) {
  const safariClient = createSafariNostr(['wss://ditto.pub/relay']);
  try {
    events = await safariClient.query([filter], { timeout: 6000, maxRetries: 2 });
    safariClient.close();
  } catch (error) {
    safariClient.close();
    throw error;
  }
} else {
  events = await Promise.race([
    nostr.query([filter]),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 15000)
    )
  ]);
}
```

### After (New Pattern)
```typescript
import { queryNostr } from '@/lib/nostrQuery';
import { TIMEOUTS, QUERY_LIMITS } from '@/lib/constants';

// Simple, unified query
const events = await queryNostr(nostr, [filter], {
  timeout: TIMEOUTS.SAFARI_QUERY,
  maxRetries: 2,
});
```

## 2. Migrating Forms

### Before (Old Pattern)
```typescript
const [formData, setFormData] = useState({ name: '', description: '' });
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Manual validation
  const newErrors: Record<string, string> = {};
  if (!formData.name.trim()) newErrors.name = 'Name is required';
  if (!formData.description.trim()) newErrors.description = 'Description is required';
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  setIsSubmitting(true);
  try {
    await onSubmit(formData);
  } catch (error) {
    // Handle error
  } finally {
    setIsSubmitting(false);
  }
};
```

### After (New Pattern)
```typescript
import { useForm } from '@/hooks/useForm';
import { FormInput, FormTextarea } from '@/components/form/FormInput';

const form = useForm({
  initialValues: { name: '', description: '' },
  validators: {
    name: (value) => value.trim() ? { isValid: true } : { isValid: false, error: 'Name is required' },
    description: (value) => value.trim() ? { isValid: true } : { isValid: false, error: 'Description is required' },
  },
  onSubmit,
});

// In JSX:
<form onSubmit={form.handleSubmit}>
  <FormInput {...form.getFieldProps('name')} label="Name" required />
  <FormTextarea {...form.getFieldProps('description')} label="Description" required />
  <Button type="submit" disabled={!form.isValid || form.isSubmitting}>
    {form.isSubmitting ? 'Submitting...' : 'Submit'}
  </Button>
</form>
```

## 3. Migrating Loading States

### Before (Old Pattern)
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      <span className="ml-2">Loading...</span>
    </div>
  );
}

if (error) {
  return (
    <div className="text-center p-6">
      <div className="text-red-500 mb-2">Error occurred</div>
      <button onClick={retry}>Try again</button>
    </div>
  );
}
```

### After (New Pattern)
```typescript
import { LoadingCard, ErrorState } from '@/components/common/LoadingState';

if (isLoading) return <LoadingCard title="Loading data..." />;
if (error) return <ErrorState title="Failed to load" onRetry={retry} />;
```

## 4. Migrating Coordinate Operations

### Before (Old Pattern)
```typescript
// Scattered coordinate parsing
const coords = coordString.split(',').map(Number);
const lat = coords[0];
const lng = coords[1];

// Manual distance calculation
const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;
// ... complex haversine formula
```

### After (New Pattern)
```typescript
import { parseCoordinateString, calculateDistance, formatCoordinates } from '@/lib/coordinateUtils';

const coords = parseCoordinateString(coordString);
if (!coords) throw new Error('Invalid coordinates');

const distance = calculateDistance(coord1, coord2);
const formatted = formatCoordinates(coords);
```

## 5. Migrating Cache Operations

### Before (Old Pattern)
```typescript
// Duplicate cache checking
const cacheNames = await caches.keys();
if (cacheNames.includes('osm-tiles')) {
  const cache = await caches.open('osm-tiles');
  const keys = await cache.keys();
  return keys.length;
}
return 0;
```

### After (New Pattern)
```typescript
import { getCacheEntryCount, CACHE_NAMES } from '@/lib';

const count = await getCacheEntryCount(CACHE_NAMES.OSM_TILES);
```

## 6. Migrating Page Layouts

### Before (Old Pattern)
```typescript
export default function MyPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DesktopHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page content */}
        </div>
      </div>
    </div>
  );
}
```

### After (New Pattern)
```typescript
import { PageLayout } from '@/components/layout';

export default function MyPage() {
  return (
    <PageLayout maxWidth="2xl" background="muted">
      {/* Page content */}
    </PageLayout>
  );
}
```

## 7. Migrating Async Operations

### Before (Old Pattern)
```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### After (New Pattern)
```typescript
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

const { data, isLoading, error, execute: fetchData } = useAsyncOperation(
  apiCall,
  {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
  }
);
```

## 8. Using Constants Instead of Magic Numbers

### Before (Old Pattern)
```typescript
const events = await query([filter], { timeout: 5000 });
if (geocaches.length > 30) { /* ... */ }
if (name.length < 3 || name.length > 100) { /* ... */ }
```

### After (New Pattern)
```typescript
import { TIMEOUTS, QUERY_LIMITS, VALIDATION_LIMITS } from '@/lib/constants';

const events = await query([filter], { timeout: TIMEOUTS.SAFARI_QUERY });
if (geocaches.length > QUERY_LIMITS.SAFARI_GEOCACHES) { /* ... */ }
if (name.length < VALIDATION_LIMITS.NAME_MIN_LENGTH || name.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) { /* ... */ }
```

## 9. Migration Checklist

When migrating a component, check for these patterns:

- [ ] **Nostr queries**: Replace Safari-specific code with `queryNostr()`
- [ ] **Form handling**: Replace manual validation with `useForm()`
- [ ] **Loading states**: Replace custom loading UI with common components
- [ ] **Coordinate operations**: Use coordinate utilities
- [ ] **Cache operations**: Use cache utilities
- [ ] **Magic numbers**: Replace with constants
- [ ] **Async operations**: Use `useAsyncOperation()` for consistent error handling
- [ ] **Layout patterns**: Use layout components
- [ ] **Validation**: Use validation utilities
- [ ] **Error handling**: Use error utilities

## 10. Benefits After Migration

- **Consistency**: All components use the same patterns
- **Maintainability**: Changes to core logic happen in one place
- **Testing**: Utilities are easier to unit test
- **Performance**: Reduced bundle size through deduplication
- **Developer Experience**: Better TypeScript support and cleaner imports
- **Reliability**: Standardized error handling and retry logic

## 11. Gradual Migration Strategy

1. **Start with new components**: Use new patterns for all new components
2. **Migrate utilities first**: Update components that use cache/coordinate operations
3. **Migrate forms**: Update forms to use the new form hook
4. **Migrate queries**: Update Nostr query hooks
5. **Migrate layouts**: Update page components to use layout patterns
6. **Add tests**: Write tests for migrated components using the new utilities

This migration can be done incrementally without breaking existing functionality.