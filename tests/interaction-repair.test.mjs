import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('THE.ASSURER moment cards retain touch/click flip state and expanded height', async () => {
  const component = await readFile(new URL('../components/sections/TheAssurerSection.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles/sections/the-assurer.css', import.meta.url), 'utf8');

  assert.match(component, /onClick=\{\(\) => setFlippedType\(\(current\) => current === card\.type \? '' : card\.type\)\}/);
  assert.match(component, /aria-pressed=\{isFlipped\}/);
  assert.match(styles, /\.assurer-moment-expanded-grid\s*\{[^}]*min-height:\s*clamp\(360px,\s*52vh,\s*680px\);[^}]*align-items:\s*stretch;/s);
  assert.match(styles, /\.assurer-moment-card-expanded\s*\{[^}]*min-height:\s*clamp\(360px,\s*52vh,\s*680px\)\s*!important;[^}]*height:\s*clamp\(360px,\s*52vh,\s*680px\)\s*!important;/s);
});

test('THE.ASSURER waits for client storage before rendering date-bound text', async () => {
  const component = await readFile(new URL('../components/sections/TheAssurerSection.jsx', import.meta.url), 'utf8');

  assert.match(component, /useSyncExternalStore\(subscribeToHydrationState,\s*getClientHydrationState,\s*getServerHydrationState\)/);
  assert.match(component, /if \(!isHydrated\)\s*\{\s*return <section className="assurer-oracle-shell"[^>]*aria-busy="true" \/>;/s);
});

test('the control Wand travels the right edge and pauses for interaction', async () => {
  const styles = await readFile(new URL('../styles/globals.css', import.meta.url), 'utf8');

  assert.match(styles, /\.tis-rail-tab\{[^}]*animation:tis-rail-tab-travel 44s ease-in-out infinite alternate;/s);
  assert.match(styles, /\.tis-rail-tab:hover,\.tis-rail-tab:focus-visible,\.tis-rail-tab:active,\.tis-rail-tab\[aria-expanded="true"\]\{animation-play-state:paused\}/);
  assert.match(styles, /@keyframes tis-rail-tab-travel\{0%,8%\{top:[^}]+\}92%,100%\{top:calc\(100dvh - var\(--tis-rail-tab-height\)[^}]+\}\}/s);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)\{\.tis-rail-tab\{[^}]*animation:none;/s);
});
