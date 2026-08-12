import '../styles/globals.css';
import '../styles/sections/universal-frame.css';
import '../styles/opening/chaotica-opening.css';
import AppShell from '../components/shell/AppShell';

export const metadata = {
  title: 'CHAOTICA',
  description: 'CHAOTICA',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/chaotica-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/chaotica-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/chaotica-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/chaotica-apple-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
