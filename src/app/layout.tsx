import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout";
import { SiteChrome } from '@/components/layout/SiteChrome';
import { ToastProvider } from "@/components/ui";
import { AdScripts } from "@/components/AdScripts";
import { SITE_URL } from '@/lib/site-url';
import localFont from 'next/font/local';
import { PreviewProvider } from '@/components/PreviewProvider';
import { isReadOnlyPreview } from '@/lib/preview';

const sora = localFont({ src: './fonts/sora-latin-variable.woff2', variable: '--font-sora', weight: '400 800', display: 'swap' });
const source = localFont({ src: './fonts/source-sans-3-latin-variable.woff2', variable: '--font-source', weight: '400 700', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: "Belagavi News Today | India, Technology & Sports | Belgaum Today",
    template: "%s | Belgaum Today",
  },
  description: "Latest Belagavi and India headlines from Indian publisher RSS feeds, with technology, sports, business and source-linked AI story timelines.",
  keywords: [
    "Belgaum", "Belagavi", "Belgaum news", "Belagavi news", "Belgaum Today",
    "Karnataka news", "India news", "local news", "breaking news",
    "Belgaum news today", "business news", "technology news",
    "sports news", "entertainment news", "north Karnataka news",
  ],
  authors: [{ name: "Belgaum Today" }],
  creator: "Belgaum Today",
  publisher: "Belgaum Today",
  category: "News",
  metadataBase: new URL(SITE_URL),
  alternates: {
    types: { 'application/rss+xml': '/feed.xml' },
  },
  openGraph: {
    title: "Belagavi News Today | Belgaum Today",
    description: "Belagavi and India headlines from Indian publishers, plus source-linked story timelines.",
    url: "/",
    siteName: "Belgaum Today",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belagavi News Today | Belgaum Today",
    description: "Belagavi and India headlines from Indian publishers, plus source-linked story timelines.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preview = isReadOnlyPreview();

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sora.variable} ${source.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const darkMode = localStorage.getItem('darkMode');
                  const isDark = darkMode === 'true' || 
                    (!darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <div dangerouslySetInnerHTML={{ __html: '<!-- THESIS: A bold cobalt Home cover opens into real publisher-linked reading. OWN-WORLD: Broadcast cobalt #2F4BEB, cool white #F5F7FC, Sora display, Source Sans 3, authentic Belagavi photography. STORY: understand the national and local perspective, open the briefing, explore six categories. FIRST VIEWPORT: Home-first compact navigation, oversized white Make sense of today typography, white Read the briefing action, shaped photographic reveal. FORM: user-approved Make sense of today, grounded structure 4, surface seed 3ea3ae07; responsive photo framing replaces illustrative comp photography with verified heritage. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->' }} />
        <PreviewProvider enabled={preview}>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <SiteChrome footer={<Footer />} advertisements={!preview ? <AdScripts /> : null}>
            {children}
          </SiteChrome>
        </ToastProvider>
        </PreviewProvider>
      </body>
    </html>
  );
}
