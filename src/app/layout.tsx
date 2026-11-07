import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChordCraft - Music Chord Sheet Editor',
  description: 'Create, edit, format, and export music chord sheets with free-position chord placement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
