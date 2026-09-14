import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import PwaRegister from '@/components/pwa/PwaRegister';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';

export const dynamic = 'force-dynamic';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'سایبان | برنامه‌ریز هوشمند شخصی و ردیاب سلامت',
  description: 'سیستم یکپارچه برنامه‌ریزی روزانه، یادداشت‌برداری غنی، دستیار هوشمند فارسی و پایش سلامت چندجانبه',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'سایه‌بان',
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen selection:bg-teal-100 selection:text-teal-900" suppressHydrationWarning>
        <Providers>
          <PwaRegister />
          <PwaInstallPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}