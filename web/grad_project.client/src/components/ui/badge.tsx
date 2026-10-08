import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

const badgeVariants = {
  variant: {
    default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/80',
    secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80',
    destructive: 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/80',
    outline: 'text-[var(--foreground)] border border-[var(--input)]',
  },
};

type BadgeVariant = keyof typeof badgeVariants.variant;

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2',
          badgeVariants.variant[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
