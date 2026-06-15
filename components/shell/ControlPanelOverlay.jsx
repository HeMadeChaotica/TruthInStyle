'use client';

import { useEffect } from 'react';

const ROUTE_ITEMS = [
  { key: 'home', src: '/ui/glyphs/control%20panel/glyph-home.png', alt: 'HOME / THE.ASSURER' },
  { key: 'back', src: '/ui/glyphs/control%20panel/glyph-back.png', alt: 'Back' },
  { key: 'its-getting-thicc', src: '/ui/glyphs/control%20panel/glyph-its-getting-thicc.png', alt: 'ITS.GETTING.THICC' },
  { key: 'thicc-fitt', src: '/ui/glyphs/control%20panel/glyph-thicc-fitt.png', alt: 'THICC.FITT' },
  { key: 'da-eater', src: '/ui/glyphs/control%20panel/glyph-da-eater.png', alt: 'DA.EATER' },
  { key: 'remember-me', src: '/ui/glyphs/control%20panel/glyph-remember-me.png', alt: 'REMEMBER.ME' },
  { key: 'hopewood', src: '/ui/glyphs/control%20panel/glyph-hopewood.png', alt: 'HOPEWOOD' },
  { key: '525600', src: '/ui/glyphs/control%20panel/glyph-525600.png', alt: '525600' },
  { key: 'the-summation', src: '/ui/glyphs/control%20panel/glyph-the-summation.png', alt: 'THE.SUMMATION' },
  { key: 'clock-it', src: '/ui/glyphs/control%20panel/glyph-clock-it.png', alt: 'CLOCK.IT' },
];

export default function ControlPanelOverlay({ isOpen = false, onOpen, onClose, onSelect }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button type="button" className="tis-rail-tab" aria-expanded={isOpen} aria-controls="tis-control-rail" onClick={() => (isOpen ? onClose?.() : onOpen?.())}>☽</button>
      <aside className="tis-control-overlay" aria-hidden={!isOpen} data-open={isOpen}>
        <div className="tis-control-scrim" onClick={() => onClose?.()} />
        <nav id="tis-control-rail" className="tis-control-rail" aria-label="Right-side control panel navigation">
          {ROUTE_ITEMS.map((item) => (
            <button key={item.key} type="button" className="tis-glyph-button tis-rail-glyph" onClick={() => onSelect?.(item.key)} aria-label={item.alt}>
              <img src={item.src} alt="" draggable={false} />
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
