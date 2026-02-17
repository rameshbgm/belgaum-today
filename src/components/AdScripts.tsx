'use client';

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function AdScripts() {
    return (
        <>
            {/* ── Google Analytics (gtag.js) ── */}
            {GA_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}', {
                                page_path: window.location.pathname,
                                anonymize_ip: true,
                            });
                        `}
                    </Script>
                </>
            )}

            {/* ── Google AdSense ── */}
            {ADSENSE_ID && (
                <Script
                    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
                    strategy="afterInteractive"
                    crossOrigin="anonymous"
                />
            )}

            {/* ── Meta (Facebook) Pixel ── */}
            {META_PIXEL_ID && (
                <>
                    <Script id="meta-pixel" strategy="afterInteractive">
                        {`
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${META_PIXEL_ID}');
                            fbq('track', 'PageView');
                        `}
                    </Script>
                    <noscript>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            height="1"
                            width="1"
                            style={{ display: 'none' }}
                            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                            alt=""
                        />
                    </noscript>
                </>
            )}
        </>
    );
}
