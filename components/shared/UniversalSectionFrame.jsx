'use client';

const TOKEN_MIN_HEIGHT = {
  compact: '120px',
  standard: '180px',
  medium: '240px',
  tall: '320px',
  strip: '72px',
  'hero-strip': '96px'
};

export function SectionShell({ children, className = '' }) { return <section className={`usf-shell ${className}`}>{children}</section>; }
export function ScenePlate({ children, className = '' }) { return <div className={`usf-scene ${className}`}>{children}</div>; }
export function SectionOverlay({ children, className = '' }) { return <div className={`usf-overlay ${className}`}>{children}</div>; }
export function ArtLane({ children, className = '' }) { return <aside className={`usf-art ${className}`}>{children}</aside>; }
export function ContentScroller({ children, className = '' }) { return <main className={`usf-scroll ${className}`}>{children}</main>; }

export function BlueprintStack({ shelves }) {
  return <div className="usf-stack">{shelves.map((shelf, i) => <BlueprintShelf key={shelf.id || i} shelf={shelf} />)}</div>;
}

export function BlueprintShelf({ shelf }) {
  const cols = shelf.columns || shelf.panels.length;
  return <div className="usf-shelf" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{shelf.panels.map((panel) => <BlueprintPanel key={panel.id} {...panel} />)}</div>;
}

export function BlueprintPanel({ token = 'standard', content, className = '' }) {
  return <section className={`usf-panel ${className}`} style={{ minHeight: TOKEN_MIN_HEIGHT[token] || TOKEN_MIN_HEIGHT.standard }}>{content}</section>;
}
