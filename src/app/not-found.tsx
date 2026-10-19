import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
export default function NotFound() {
    return <div className="info-page min-h-[60vh]"><p className="mb-6 text-sm text-muted">404 · Page unavailable</p><h1>This story has another address.</h1><p className="info-intro">The page may have moved, or the link may be incomplete. Find a story in the archive or return to today&rsquo;s briefing.</p><div className="flex flex-wrap gap-3"><Link href="/briefing" className="primary-action"><ArrowLeft size={17} />Today&rsquo;s briefing</Link><Link href="/search" className="text-action"><Search size={17} />Search the archive</Link></div></div>;
}
