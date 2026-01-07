import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth';
import { PWAProvider } from '@/components/pwa';
import { DatabaseProvider } from '@/components/database-provider';

export const metadata: Metadata = {
  title: 'EMERGE Intervention Planner',
  description: 'Research-based intervention planning for reading and math',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EMERGE',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#FF006E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-brand bg-foundation text-text-primary min-h-screen">
        <DatabaseProvider>
          <AuthProvider>
            <PWAProvider>
              {children}
            </PWAProvider>
          </AuthProvider>
        </DatabaseProvider>
      </body>
    </html>
  );
}
