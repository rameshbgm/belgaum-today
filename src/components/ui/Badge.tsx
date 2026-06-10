import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'custom';
    color?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'default', color, size = 'sm', className }: BadgeProps) {
    const variants = {
        default: 'bg-[#F3EEE4] text-[#6B6B66] dark:bg-[#2A251E] dark:text-[#A7A095]',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        info: 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
        custom: '',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    const customStyle = variant === 'custom' && color
        ? { backgroundColor: `${color}20`, color: color }
        : {};

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                variants[variant],
                sizes[size],
                className
            )}
            style={customStyle}
        >
            {children}
        </span>
    );
}
