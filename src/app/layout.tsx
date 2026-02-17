import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout";
import { ToastProvider } from "@/components/ui";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: "Belgaum Today - Local News, Global Standards",
    template: "%s | Belgaum Today",
  },
  description: "Your trusted source for the latest news from Belgaum and beyond. Stay updated with India, Business, Technology, Entertainment, Sports, and local Belgaum news.",
  keywords: ["Belgaum", "news", "Karnataka", "India news", "local news", "Belgaum Today"],
  authors: [{ name: "Belgaum Today" }],
  creator: "Belgaum Today",
  publisher: "Belgaum Today",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Belgaum Today - Local News, Global Standards",
    description: "Your trusted source for the latest news from Belgaum and beyond.",
    url: "/",
    siteName: "Belgaum Today",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Belgaum Today - Local News, Global Standards",
    description: "Your trusted source for the latest news from Belgaum and beyond.",
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
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect admin routes to hide main site header/footer
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || headersList.get('x-invoke-path') || '';
  const isAdmin = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          {isAdmin ? (
            <main id="main-content">
              {children}
            </main>
          ) : (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
