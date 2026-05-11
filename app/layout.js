import '../styles/globals.css';
import AppShell from '../components/shell/AppShell';

export const metadata = {
  title: 'TruthInStyle',
  description: 'TruthInStyle'
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
