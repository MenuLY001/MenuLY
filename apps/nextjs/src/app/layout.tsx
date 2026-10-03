import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Menuly — QR Digital Menu Platform',
  description: 'Beautiful digital menus for restaurants, powered by QR codes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body style={{ fontFamily: 'Inter, sans-serif', margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
