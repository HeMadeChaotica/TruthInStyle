import '@/styles/sections/the-assurer.css';

export default function TheAssurerSection() {
  return (
    <section className="the-assurer-shell" aria-label="THE.ASSURER">
      <div className="the-assurer-scene" role="img" aria-label="THE.ASSURER DAILY RECEIVER AND ASSESSMENT HUB" />

      <div className="the-assurer-overlay" aria-hidden="true">
        <header className="the-assurer-header">
          <p className="the-assurer-kicker">TRUTHINSTYLE / CHAOTICA</p>
          <h1 className="the-assurer-title">THE.ASSURER</h1>
          <p className="the-assurer-subtitle">FORMERLY DAILYHUB · DAILY RECEIVER AND ASSESSMENT HUB</p>
        </header>
      </div>

      <div className="the-assurer-clear-zone" aria-label="MISTA.THICC PROTECTED CLEAR ZONE" />
    </section>
  );
}
