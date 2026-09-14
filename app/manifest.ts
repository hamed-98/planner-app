import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سایه‌بان | برنامه‌ریز هوشمند شخصی و ردیاب سلامت',
    short_name: 'سایه‌بان',
    description: 'سیستم یکپارچه برنامه‌ریزی روزانه، یادداشت‌برداری، باشگاه شناخت و ردیاب سلامت',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0d9488',
    dir: 'rtl',
    lang: 'fa',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
