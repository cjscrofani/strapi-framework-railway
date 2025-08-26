'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const loadingVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(loadingVariants({ size }), 'text-current', className)}
        role="status"
        aria-label="Loading"
        {...props}
      />
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg';
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-1 h-1',
      default: 'w-2 h-2',
      lg: 'w-3 h-3',
    };

    return (
      <div
        ref={ref}
        className={cn('flex space-x-1', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'bg-current rounded-full animate-pulse',
              sizeClasses[size]
            )}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    );
  }
);
LoadingDots.displayName = 'LoadingDots';

interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number;
  animated?: boolean;
}

const LoadingBar = React.forwardRef<HTMLDivElement, LoadingBarProps>(
  ({ className, progress, animated = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full bg-muted rounded-full overflow-hidden',
          className
        )}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <div
          className={cn(
            'h-2 bg-primary rounded-full transition-all duration-300 ease-in-out',
            animated && 'animate-pulse'
          )}
          style={{
            width: progress ? `${Math.min(100, Math.max(0, progress))}%` : '100%',
          }}
        />
      </div>
    );
  }
);
LoadingBar.displayName = 'LoadingBar';

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  avatar?: boolean;
  height?: string;
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, lines = 3, avatar = false, height, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('animate-pulse', className)} {...props}>
        {avatar && (
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'bg-muted rounded',
                height || 'h-4',
                index === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    );
  }
);
LoadingSkeleton.displayName = 'LoadingSkeleton';

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
  blur?: boolean;
  spinner?: boolean;
  message?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, show, blur = true, spinner = true, message, children, ...props }, ref) => {
    if (!show && !children) return null;

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}
        {show && (
          <div
            className={cn(
              'absolute inset-0 z-50 flex items-center justify-center',
              blur
                ? 'bg-background/80 backdrop-blur-sm'
                : 'bg-background/50'
            )}
          >
            <div className="flex flex-col items-center space-y-4">
              {spinner && <LoadingSpinner size="lg" />}
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
LoadingOverlay.displayName = 'LoadingOverlay';

// Full page loader
interface PageLoaderProps {
  message?: string;
  logo?: React.ReactNode;
}

const PageLoader = ({ message = 'Loading...', logo }: PageLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6">
        {logo && <div className="text-2xl">{logo}</div>}
        <LoadingSpinner size="xl" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export {
  LoadingSpinner,
  LoadingDots,
  LoadingBar,
  LoadingSkeleton,
  LoadingOverlay,
  PageLoader,
  loadingVariants,
};