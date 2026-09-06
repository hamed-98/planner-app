import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'سایبان | برنامه‌ریز هوشمند شخصی و ردیاب سلامت',
  description: 'سیستم یکپارچه برنامه‌ریزی روزانه، یادداشت‌برداری غنی، دستیار هوشمند فارسی و پایش سلامت چندجانبه',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen selection:bg-teal-100 selection:text-teal-900" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}