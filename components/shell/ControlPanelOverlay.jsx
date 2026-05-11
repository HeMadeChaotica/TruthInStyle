import { useEffect, useMemo, useRef } from 'react';

const CONTROL_ITEMS = [
  { key: 'home', src: '/control-panel/control-home.PNG', alt: 'Home' },
  { key: 'back', src: '/control-panel/control-back.png', alt: 'Back' },
  { key: 'the-summation', src: '/control-panel/control-the-summation.png', alt: 'The Summation' },
  { key: 'thicc-fitt', src: '/control-panel/control-thicc-fitt.png', alt: 'Thicc Fitt' },
  { key: 'da-eater', src: '/control-panel/control-da-eater.png', alt: 'Da Eater' },
  { key: 'remember-me', src: '/control-panel/control-remember-me.png', alt: 'Remember Me' },
  { key: 'hopewood', src: '/control-panel/control-hopewood.png', alt: 'Hopewood' },
  { key: '525600', src: '/control-panel/control-525600.png', alt: '525600' },
  { key: 'clock-it', src: '/control-panel/control-clock-it.png', alt: 'Clock It' },
  { key: 'summate', src: '/control-panel/control-summate.png', alt: 'Summate' },
  { key: 'so-let-it-be-done', src: '/control-panel/control-SoLetItBeDone.png', alt: 'So Let It Be Done' }
];

export default function ControlPanelOverlay({
  isOpen = false,
  onClose,
  onSelect,
  onSoLetItBeDone,
  completedSummationSketch
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handlers = useMemo(
    () => ({
      'so-let-it-be-done': () => onSoLetItBeDone?.(completedSummationSketch)
    }),
    [completedSummationSketch, onSoLetItBeDone]
  );

  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="Control panel"
      data-open={isOpen}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        background: 'transparent',
        zIndex: 1000
      }}
    >
      <div
        onClick={() => onClose?.()}
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close control panel"
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      />

      <nav
        ref={panelRef}
        aria-label="Control panel navigation"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 'min(84vw, 320px)',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'transparent',
          borderRight: '1px solid transparent',
          borderImage: 'linear-gradient(180deg, #56e8ff, #fd5fff, #ffd54f, #56e8ff) 1',
          transform: isOpen ? 'translateX(0)' : 'translateX(-112%)',
          transition: 'transform 180ms ease-out',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        }}
      >
        {CONTROL_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              handlers[item.key]?.();
              onSelect?.(item.key);
            }}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              padding: '0',
              cursor: 'pointer',
              outlineOffset: '2px'
            }}
          >
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                background: 'transparent',
                mixBlendMode: 'normal'
              }}
            />
          </button>
        ))}
      </nav>
    </aside>
  );
}
