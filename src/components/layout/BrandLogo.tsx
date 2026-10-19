import Image from 'next/image';

/** The original wordmark supplied by the site owner, kept in its own colors. */
export function BrandLogo() {
    return <Image
        src="/images/belgaum-today-logo.png"
        alt="Belgaum Today"
        width={1086}
        height={158}
        className="brand-logo"
        loading="eager"
        unoptimized
    />;
}
