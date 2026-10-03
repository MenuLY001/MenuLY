import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Menuly — QR Digital Menu Platform',
  description: 'Beautiful digital menus for restaurants, powered by QR codes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), sans-serif', margin: 0, padding: 0 }}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
