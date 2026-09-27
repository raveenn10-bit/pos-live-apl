import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/src/context/ThemeContext';

export const metadata: Metadata = {
  title: 'AppleVision Store Galle - Commercial POS',
  description: 'AppleVision Store Galle - Commercial Point of Sale System',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AppleVision POS',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-hidden overscroll-none select-none">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text fixed inset-0 w-full h-[100dvh] overflow-hidden select-none overscroll-none">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
