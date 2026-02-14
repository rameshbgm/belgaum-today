/**
 * Fallback SVG image for news articles without featured images
 */
export function NewsFallbackImage({ className = '' }: { className?: string }) {
    return (
        <div className={`w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center ${className}`}>
            <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-40"
            >
                {/* Newspaper icon */}
                <rect x="12" y="16" width="56" height="48" rx="4" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-400 dark:text-gray-600" />
                <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-gray-400 dark:text-gray-600" />
                <line x1="20" y1="36" x2="60" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-300 dark:text-gray-700" />
                <line x1="20" y1="42" x2="55" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-300 dark:text-gray-700" />
                <line x1="20" y1="48" x2="58" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-300 dark:text-gray-700" />
                <line x1="20" y1="54" x2="45" y2="54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-300 dark:text-gray-700" />
                {/* Image placeholder box */}
                <rect x="48" y="24" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gray-400 dark:text-gray-600" />
                <circle cx="52" cy="28" r="1.5" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
                <polyline points="49,33 53,29 56,31 61,27" stroke="currentColor" strokeWidth="1" fill="none" className="text-gray-400 dark:text-gray-600" />
            </svg>
        </div>
    );
}
