import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        default: 'min-h-[80px]',
        sm: 'min-h-[60px] text-xs',
        lg: 'min-h-[120px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  characterLimit?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      characterLimit,
      variant,
      size,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperTextId = helperText ? `${textareaId}-helper` : undefined;
    const describedBy = [errorId, helperTextId].filter(Boolean).join(' ') || undefined;

    const characterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = characterLimit && characterCount > characterLimit;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            textareaVariants({ 
              variant: isOverLimit ? 'error' : variant, 
              size 
            }),
            className
          )}
          ref={ref}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={error || isOverLimit ? 'true' : undefined}
          {...props}
        />
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <p id={errorId} className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            
            {helperText && !error && (
              <p id={helperTextId} className="text-sm text-muted-foreground">
                {helperText}
              </p>
            )}
            
            {isOverLimit && (
              <p className="text-sm font-medium text-destructive">
                Character limit exceeded
              </p>
            )}
          </div>
          
          {characterLimit && (
            <p
              className={cn(
                'text-sm tabular-nums',
                isOverLimit
                  ? 'text-destructive font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {characterCount}/{characterLimit}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };