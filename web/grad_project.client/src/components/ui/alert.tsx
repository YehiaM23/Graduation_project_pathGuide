import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

const alertVariants = {
  default: 'bg-[var(--background)] text-[var(--foreground)]',
  destructive: 'border-[var(--destructive)]/50 text-[var(--destructive)] [&>svg]:text-[var(--destructive)]',
  success: 'border-green-500/50 text-green-700 bg-green-50 [&>svg]:text-green-600',
};

type AlertVariant = keyof typeof alertVariants;

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-[var(--foreground)]',
        alertVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
);
AlertDescription.displayName = 'AlertDescription';
