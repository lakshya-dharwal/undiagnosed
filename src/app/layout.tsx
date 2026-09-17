import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Undiagnosed',
  description: 'Language for what your body is doing, and a clear next step.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
