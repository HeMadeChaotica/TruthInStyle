import '../styles/tokens.css';
import '../styles/shell.css';
import '../styles/globals.css';
import '../styles/sections/thicc-fitt.css';
import '../styles/sections/its-getting-thicc.css';
import '../styles/sections/da-eater.css';
import '../styles/sections/remember-me.css';
import '../styles/sections/assurer.css';
import '../styles/sections/summation.css';
import '../styles/sections/hopewood.css';
import '../styles/sections/525600.css';
import '../styles/sections/clock-it.css';
import '../styles/sections/the-work.css';
import AppShell from '../components/shell/AppShell';

export const metadata = {
  title: 'TruthInStyle',
  description: 'TruthInStyle rebuild skeleton'
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
