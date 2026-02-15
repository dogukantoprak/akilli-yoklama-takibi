import { cn } from '@/lib/utils';
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';

export default Badge;
