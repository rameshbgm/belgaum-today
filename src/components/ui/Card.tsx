import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: boolean;
}

export function Card({ children, className, hover = false, gradient = false }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl overflow-hidden',
                'bg-white dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                hover && 'transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/50',
                gradient && 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50', className)}>
            {children}
        </div>
    );
}
