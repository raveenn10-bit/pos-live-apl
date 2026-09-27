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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
