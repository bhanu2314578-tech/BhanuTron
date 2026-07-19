'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Variant = 'card' | 'text' | 'avatar' | 'button';

interface LoadingSkeletonProps {
  variant?: Variant;
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  variant = 'text',
  className,
  count = 3,
}: LoadingSkeletonProps) {
  const renderShape = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="space-y-3 rounded-lg border p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
        );
      case 'avatar':
        return (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        );
      case 'button':
        return <Skeleton className="h-10 w-28 rounded-md" />;
      default:
        return <Skeleton className="h-3 w-full" />;
    }
  };

  if (variant === 'card' || variant === 'avatar') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>{renderShape()}</React.Fragment>
        ))}
      </div>
    );
  }

  return <div className={cn('space-y-2', className)}>{renderShape()}</div>;
}
