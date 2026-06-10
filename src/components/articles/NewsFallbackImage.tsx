import Image from 'next/image';

/**
 * Fallback image for news articles without featured images.
 * Deterministically selects from available fallback images using the optional
 * seed (e.g. article id). Without a seed it always uses the first image so the
 * server and client render identically (no hydration mismatch).
 */
export function NewsFallbackImage({ 
    className = '', 
    seed 
}: { 
    className?: string;
    seed?: string | number;
}) {
    // Available fallback images
    const fallbackImages = [
        '/images/image-not-available/image-not-available.jpeg',
        '/images/image-not-available/image-not-available1.jpeg',
        '/images/image-not-available/image-not-available2.jpeg'
    ];

    // Select image deterministically based on seed, or randomly if no seed
    const getImageIndex = () => {
        if (seed !== undefined) {
            // Use seed to deterministically select an image
            const hash = typeof seed === 'string' 
                ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                : seed;
            return Math.abs(hash) % fallbackImages.length;
        }
        // No seed: always use the first image (deterministic → no hydration mismatch)
        return 0;
    };

    const selectedImage = fallbackImages[getImageIndex()];

    return (
        <div className={`w-full h-full bg-[#F5F1E8] dark:bg-[#211D17] flex items-center justify-center ${className}`}>
            <Image
                src={selectedImage}
                alt="Image not available"
                fill
                className="object-contain p-4"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
        </div>
    );
}
