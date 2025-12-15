import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth';

export const metadata: Metadata = {
  title: 'EMERGE Intervention Planner',
  description: 'Research-based intervention planning for reading and math',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-brand bg-foundation text-text-primary min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
