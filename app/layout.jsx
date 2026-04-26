import '../src/styles/global.css';

export const metadata = {
  title: 'CHAOTICA',
  description: 'TRUTHINSTYLE'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
