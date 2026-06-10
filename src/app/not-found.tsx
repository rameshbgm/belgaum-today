import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
                {/* 404 Graphic */}
                <div className="relative mb-8">
                    <div className="font-display text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E8590C] to-[#C2410C] opacity-25 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">📰</div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
                    Page Not Found
                </h1>
                <p className="text-muted mb-8 max-w-md mx-auto">
                    Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or perhaps never existed in the first place.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button>
                            <Home className="w-4 h-4 mr-2" />
                            Back to Homepage
                        </Button>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-hairline">
                  
                </div>
            </div>
        </div>
    );
}
