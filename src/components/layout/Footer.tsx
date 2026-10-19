import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { BrandLogo } from './BrandLogo';

export function Footer() {
    return <footer className="site-footer"><div className="container footer-inner">
        <div className="footer-top">
            <div><Link href="/" className="wordmark"><BrandLogo /></Link><p>Headlines from across India. Discover the story, then read it at the source.</p></div>
            <nav className="footer-nav" aria-label="Footer news categories"><Link href="/">Home</Link>{TOP_LEVEL_CATEGORIES.map(category => <Link key={category} href={`/${category}`}>{CATEGORY_META[category].name}</Link>)}<Link href="/briefing">Today&rsquo;s briefing</Link><Link href="/blog">Blog</Link><Link href="/feed.xml">RSS feed <ArrowUpRight size={14} className="ml-1" /></Link></nav>
        </div>
        <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Belgaum Today</p>
            <nav aria-label="Information"><Link href="/about">About</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><a href="mailto:ask@belgaum.today">Contact</a><Link href="/admin/login">Editorial desk</Link></nav>
            <p>Built by <a href="https://rameshsnotebook.com/" target="_blank" rel="noopener noreferrer">Ramesh Maharaddi</a></p>
        </div>
    </div></footer>;
}
