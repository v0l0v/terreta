import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface BaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string | ReactNode;
  description?: string | ReactNode;
  descriptionAs?: 'p' | 'div';
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auth';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showHeader?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl", 
  xl: "sm:max-w-4xl",
  full: "max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh]",
  auth: "max-w-[95vw] sm:max-w-md max-h-[90vh] max-h-[90dvh] p-0 overflow-hidden rounded-2xl",
};

export function BaseDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  descriptionAs = 'p',
  children,
  size = 'md',
  className,
  headerClassName,
  contentClassName,
  showHeader = true,
  ...props
}: BaseDialogProps) {
  const sizeClass = sizeClasses[size];
  const DescriptionComponent = descriptionAs === 'div' ? 'div' : DialogDescription;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(sizeClass, contentClassName, className)}
        {...props}
      >
        {showHeader && (title || description) && (
          <DialogHeader className={cn(headerClassName)}>
            {title && (
              <DialogTitle className={typeof title === 'string' ? 'text-xl' : ''}>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DescriptionComponent className="text-center">
                {description}
              </DescriptionComponent>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}