import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import './globals.css';

export const metadata: Metadata = {
  title: 'CSV Editor',
  description: 'A basic CSV editor',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-600 h-screen">
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}
