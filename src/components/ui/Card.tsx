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
                'rounded-lg overflow-hidden',
                'bg-surface',
                'border border-hairline',
                hover && 'transition-colors duration-150 hover:border-primary/40',
                gradient && 'bg-surface',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-hairline', className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
            <div className={cn('px-6 py-4 border-t border-hairline bg-background', className)}>
            {children}
        </div>
    );
}
