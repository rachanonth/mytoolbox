import { Analytics } from '@vercel/analytics/next';

export const metadata = { title: 'KMP Toolbox' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
