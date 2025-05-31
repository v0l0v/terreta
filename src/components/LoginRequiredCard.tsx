import { LucideIcon } from 'lucide-react';
import { InfoCard } from '@/components/ui/card-patterns';
import { LoginArea } from '@/components/auth/LoginArea';

interface LoginRequiredCardProps {
  /** Icon to display in the card */
  icon: LucideIcon;
  /** Custom title for the card (defaults to "Login Required") */
  title?: string;
  /** Description text explaining why login is needed */
  description: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A reusable card component that displays a login required message
 * with a LoginArea component for authentication.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LoginRequiredCard
 *   icon={Bookmark}
 *   description="Please log in to view your saved caches."
 * />
 * 
 * // With custom title and styling
 * <LoginRequiredCard
 *   icon={MapPin}
 *   title="Authentication Required"
 *   description="You need to be logged in to create a geocache."
 *   className="max-w-md mx-auto"
 * />
 * ```
 */
export function LoginRequiredCard({ 
  icon, 
  title = "Login Required", 
  description, 
  className 
}: LoginRequiredCardProps) {
  return (
    <InfoCard
      icon={icon}
      title={title}
      description={description}
      action={<LoginArea />}
      className={className}
    />
  );
}