'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useReadOnlyPreview } from '@/components/PreviewProvider';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    mutation?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, disabled, mutation = false, ...props }, ref) => {
        const preview = useReadOnlyPreview();
        const baseStyles = 'inline-flex min-h-11 items-center justify-center gap-1.5 font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-3 disabled:opacity-45 disabled:cursor-not-allowed rounded-lg';

        const variants = {
            primary: 'bg-[#2F4BEB] text-white hover:bg-[#243AC4]',
            secondary: 'bg-ink text-background hover:opacity-90',
            outline: 'border border-hairline bg-surface text-ink hover:bg-soft',
            ghost: 'text-ink hover:bg-soft',
            danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || loading || (preview && mutation)}
                title={preview && mutation ? 'Unavailable in read-only preview' : props.title}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
