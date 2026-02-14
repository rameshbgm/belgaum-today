'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, type = 'text', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                        type={type}
                        className={cn(
                            'block w-full rounded-lg border bg-white dark:bg-gray-900',
                            'px-4 py-2.5 text-gray-900 dark:text-white',
                            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
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
                    <p className="mt-1.5 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
