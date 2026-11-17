'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsPhoto } from '@/components/articles/NewsPhoto';
import { PublisherLink } from '@/components/articles/PublisherLink';

export type CoverStory = {
    id: number; title: string; featured_image: string | null; source_name: string; source_url: string;
};

export function HomeStoryCarousel({ stories }: { stories: CoverStory[] }) {
    const [current, setCurrent] = useState(0);
    const slides = stories.slice(0, 5);
    if (!slides.length) return null;
    const active = current % slides.length;
    const move = (step: number) => setCurrent((active + step + slides.length) % slides.length);

    return <div className="home-hero-figure" role="region" aria-roledescription="carousel" aria-label="AI-selected India stories"
        onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                move(event.key === 'ArrowLeft' ? -1 : 1);
            }
        }}>
        <svg className="home-clip-definitions" width="0" height="0" aria-hidden="true"><defs><clipPath id="home-photo-clip" clipPathUnits="objectBoundingBox"><path data-photo-shape d="M0,.38 C0,.285 .025,.236 .08,.228 L.6,.122 C.66,.114 .66,.01 .74,0 L1,0 L1,.95 Q1,1 .96,1 L.04,1 Q0,1 0,.95 Z" /></clipPath></defs></svg>
        <div aria-live="polite" aria-atomic="true">
            {slides.map((story, index) => <figure key={story.id} hidden={index !== active} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`}>
                <PublisherLink article={story} className="home-hero-image" ariaLabel={story.title}><NewsPhoto src={story.featured_image} priority={index === 0} /></PublisherLink>
                <figcaption className="home-photo-credit">AI-selected India story · <PublisherLink article={story}>{story.title}</PublisherLink> · {story.source_name}</figcaption>
            </figure>)}
        </div>
        {slides.length > 1 && <div className="home-carousel-controls">
            <button type="button" aria-label="Previous India story" onClick={() => move(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
            <div className="home-carousel-selectors" role="group" aria-label="Choose an India story">
                {slides.map((story, index) => <button type="button" key={story.id} aria-label={`Show story ${index + 1}: ${story.title}`} aria-current={index === active ? 'true' : undefined} onClick={() => setCurrent(index)}>{index + 1}</button>)}
            </div>
            <button type="button" aria-label="Next India story" onClick={() => move(1)}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>}
    </div>;
}
