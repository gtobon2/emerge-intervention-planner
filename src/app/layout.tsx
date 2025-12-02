import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Atkinson_Hyperlegible } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
});

const atkinson = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-student',
  display: 'swap',
});

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
    <html lang="en" className={`${plusJakarta.variable} ${atkinson.variable}`}>
      <body className="font-brand bg-foundation text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
