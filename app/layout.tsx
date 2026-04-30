import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InstaBoost — Free Instagram Views & Growth',
  description: 'Get free Instagram Reel views instantly. Premium growth tools for serious creators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
