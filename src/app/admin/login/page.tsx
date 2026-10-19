"use client";
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui';
import { BrandLogo } from '@/components/layout/BrandLogo';
function LoginForm() {
    const params = useSearchParams();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError('');
        if (!email || !password) { setError('Enter your email address and password.'); return; }
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const result = await response.json();
            if (!response.ok || !result.success) { setError(result.error || 'Could not sign in. Please try again.'); return; }
            showToast('Signed in', 'success');
            const redirect = params.get('redirect');
            window.location.href = redirect?.startsWith('/admin/') ? redirect : '/admin/dashboard';
        } catch { setError('Could not reach the server. Please try again.'); }
        finally { setLoading(false); }
    };
    return <div className="login-form"><h1>Welcome to the desk.</h1><p>Sign in to manage stories, publisher feeds, and your news briefing.</p><form onSubmit={submit}>
        <div className="login-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></div>
        <div className="login-field"><label htmlFor="password">Password</label><div className="relative"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /><button className="absolute right-1 top-1 icon-button text-muted" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
        {error && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button type="submit" className="primary-action" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}<ArrowRight size={18} /></button>
    </form><Link href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm text-muted"><ArrowLeft size={16} />Back to the news</Link></div>;
}
export default function LoginPage() {
    return <main id="main-content" className="login-page"><div className="login-brand"><Link href="/" className="wordmark"><BrandLogo /></Link><div><h2>The stories start here.</h2><p>Your editorial workspace for the news that matters, from across India to Belgaum.</p></div><span className="hidden text-sm text-white/80 sm:block">Editorial desk</span></div><div className="login-form-wrap"><Suspense fallback={<p role="status">Loading sign in…</p>}><LoginForm /></Suspense></div></main>;
}
