'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrows = {
        top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45',
        bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
        left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45',
        right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45',
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={cn(
                        'absolute z-50 px-3 py-2 text-sm',
                        'bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg',
                        'animate-fade-in whitespace-nowrap',
                        positions[position],
                        className
                    )}
                >
                    {content}
                    <div
                        className={cn(
                            'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700',
                            arrows[position]
                        )}
                    />
                </div>
            )}
        </div>
    );
}
