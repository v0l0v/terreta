/**
 * Modernized geocache form using new form utilities
 */

import { useForm } from '@/hooks/useForm';
import { FormInput, FormTextarea, FormSelect, FormNumberInput } from '@/components/form/FormInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonLoading } from '@/components/ui/loading';
import { validateGeocacheForm, type GeocacheFormData } from '@/lib/validation';
import { VALIDATION_LIMITS } from '@/lib/constants';
import { CACHE_TYPE_OPTIONS, DIFFICULTY_TERRAIN_OPTIONS } from '@/lib/geocache-constants';

interface GeocacheFormProps {
  initialData?: Partial<GeocacheFormData>;
  onSubmit: (data: GeocacheFormData) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
}

export function GeocacheForm({ 
  initialData = {}, 
  onSubmit, 
  onSuccess,
  className 
}: GeocacheFormProps) {
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      coordinates: { lat: 0, lng: 0 },
      difficulty: 1,
      terrain: 1,
      type: 'traditional',
      hint: '',
      ...initialData,
    } as GeocacheFormData,
    validators: {
      name: (value) => {
        if (!value.trim()) return { isValid: false, error: 'Name is required' };
        if (value.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
          return { isValid: false, error: `Name must be at least ${VALIDATION_LIMITS.NAME_MIN_LENGTH} characters` };
        }
        if (value.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
          return { isValid: false, error: `Name must be no more than ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters` };
        }
        return { isValid: true };
      },
      description: (value) => {
        if (!value.trim()) return { isValid: false, error: 'Description is required' };
        if (value.length < VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH) {
          return { isValid: false, error: `Description must be at least ${VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH} characters` };
        }
        if (value.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
          return { isValid: false, error: `Description must be no more than ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters` };
        }
        return { isValid: true };
      },
      coordinates: (value) => {
        if (value.lat < -90 || value.lat > 90) {
          return { isValid: false, error: 'Latitude must be between -90 and 90' };
        }
        if (value.lng < -180 || value.lng > 180) {
          return { isValid: false, error: 'Longitude must be between -180 and 180' };
        }
        return { isValid: true };
      },
      difficulty: (value) => {
        if (value < VALIDATION_LIMITS.DIFFICULTY_MIN || value > VALIDATION_LIMITS.DIFFICULTY_MAX) {
          return { isValid: false, error: `Difficulty must be between ${VALIDATION_LIMITS.DIFFICULTY_MIN} and ${VALIDATION_LIMITS.DIFFICULTY_MAX}` };
        }
        return { isValid: true };
      },
      terrain: (value) => {
        if (value < VALIDATION_LIMITS.TERRAIN_MIN || value > VALIDATION_LIMITS.TERRAIN_MAX) {
          return { isValid: false, error: `Terrain must be between ${VALIDATION_LIMITS.TERRAIN_MIN} and ${VALIDATION_LIMITS.TERRAIN_MAX}` };
        }
        return { isValid: true };
      },
      hint: (value) => {
        if (value && value.length > VALIDATION_LIMITS.HINT_MAX_LENGTH) {
          return { isValid: false, error: `Hint must be no more than ${VALIDATION_LIMITS.HINT_MAX_LENGTH} characters` };
        }
        return { isValid: true };
      },
    },
    onSubmit,
    onSuccess,
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create Geocache</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <FormInput
              {...form.getFieldProps('name')}
              label="Cache Name"
              placeholder="Give your cache a memorable name"
              required
            />

            <FormTextarea
              {...form.getFieldProps('description')}
              label="Description"
              placeholder="Describe your cache, its location, and any special instructions"
              rows={4}
              required
            />

            <FormInput
              {...form.getFieldProps('hint')}
              label="Hint"
              placeholder="Provide a cryptic hint to help seekers (optional)"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <FormNumberInput
              value={form.values.coordinates.lat}
              onChange={(lat) => form.setFieldValue('coordinates', { ...form.values.coordinates, lat })}
              label="Latitude"
              placeholder="40.7128"
              step={0.000001}
              min={-90}
              max={90}
              required
              error={form.fields.coordinates.touched ? form.fields.coordinates.error : undefined}
            />

            <FormNumberInput
              value={form.values.coordinates.lng}
              onChange={(lng) => form.setFieldValue('coordinates', { ...form.values.coordinates, lng })}
              label="Longitude"
              placeholder="-74.0060"
              step={0.000001}
              min={-180}
              max={180}
              required
              error={form.fields.coordinates.touched ? form.fields.coordinates.error : undefined}
            />
          </div>

          {/* Cache Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              {...form.getFieldProps('type')}
              label="Cache Type"
              options={CACHE_TYPE_OPTIONS}
            />

            <FormNumberInput
              {...form.getFieldProps('difficulty')}
              label="Difficulty"
              min={VALIDATION_LIMITS.DIFFICULTY_MIN}
              max={VALIDATION_LIMITS.DIFFICULTY_MAX}
              step={0.5}
            />

            <FormNumberInput
              {...form.getFieldProps('terrain')}
              label="Terrain"
              min={VALIDATION_LIMITS.TERRAIN_MIN}
              max={VALIDATION_LIMITS.TERRAIN_MAX}
              step={0.5}
            />
          </div>

          {/* Submit Error */}
          {form.submitError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {form.submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={form.reset}
              disabled={form.isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid || form.isSubmitting}
            >
              {form.isSubmitting ? (
                <>
                  <ButtonLoading size={16} />
                  Creating...
                </>
              ) : (
                'Create Geocache'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}