'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, id, type = 'text', ...props }, ref) => {
        const generatedId = useId();
        const fieldId = id || generatedId;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        id={fieldId}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${fieldId}-error` : undefined}
                        type={type}
                        className={cn(
                            'block min-h-11 w-full rounded-lg border border-hairline bg-surface',
                            'px-4 py-2.5 text-ink',
                            'placeholder:text-muted',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            'transition-all duration-200',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600',
                            icon && 'pl-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-red-700 dark:text-red-300" id={`${fieldId}-error`}>{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
