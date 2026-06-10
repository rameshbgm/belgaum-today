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
                hover && 'transition-all duration-300 hover:shadow-md hover:border-primary/40',
                gradient && 'bg-gradient-to-br from-surface to-[#FBF6EE] dark:from-[#211D17] dark:to-[#1A1712]',
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
        <div className={cn('px-6 py-4 border-t border-hairline bg-[#FBF6EE] dark:bg-[#1A1712]', className)}>
            {children}
        </div>
    );
}
