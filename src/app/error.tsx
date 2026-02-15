'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
                {/* Error Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Something went wrong!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    We apologize for the inconvenience. An unexpected error occurred while loading this page.
                </p>

                {/* Error Details (development only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left max-w-lg mx-auto">
                        <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-red-500 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={reset}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Link href="/">
                        <Button variant="outline">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Homepage
                        </Button>
                    </Link>
                </div>

                {/* Support */}
                <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                    If this problem persists, please contact{' '}
                    <a href="mailto:support@belgaum.today" className="text-blue-600 hover:underline">
                        support@belgaum.today
                    </a>
                </p>
            </div>
        </div>
    );
}
