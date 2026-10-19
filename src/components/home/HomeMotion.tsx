'use client';

import { useEffect, useRef } from 'react';

export function HomeMotion({ children }: { children: React.ReactNode }) {
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = root.current;
        const cover = element?.querySelector<HTMLElement>('[data-home-cover]');
        const shape = element?.querySelector<SVGPathElement>('[data-photo-shape]');
        if (!element || !cover || !shape) return;
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        let coverHeight = cover.offsetHeight;

        const draw = () => {
            frame = 0;
            const range = document.documentElement.scrollHeight - window.innerHeight;
            const pageProgress = range > 0 ? Math.min(1, window.scrollY / range) : 0;
            const progress = preference.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / (coverHeight * .75)));
            const rise = .38 * (1 - progress);
            element.style.setProperty('--page-progress', String(pageProgress));
            element.style.setProperty('--cover-shift', `${-progress * 24}px`);
            element.style.setProperty('--photo-shift', `${-progress * 7}px`);
            // The opening cover unfolds into a complete photographic window.
            shape.setAttribute('d', `M0,${rise} C0,${rise * .75} .025,${rise * .62} .08,${rise * .6} L.6,${rise * .32} C.66,${rise * .3} .66,.01 .74,0 L1,0 L1,.95 Q1,1 .96,1 L.04,1 Q0,1 0,.95 Z`);
        };
        const schedule = () => { if (!frame) frame = window.requestAnimationFrame(draw); };
        const resize = new ResizeObserver(() => { coverHeight = cover.offsetHeight; schedule(); });
        resize.observe(cover);
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        preference.addEventListener('change', schedule);
        draw();
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            preference.removeEventListener('change', schedule);
        };
    }, []);

    return <div ref={root} className="home-page">
        <div className="home-scroll-progress" aria-hidden="true" />
        {children}
    </div>;
}
