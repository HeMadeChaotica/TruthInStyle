import '../styles/globals.css';

export const metadata = {
  title: 'TruthInStyle',
  description: 'TruthInStyle'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
