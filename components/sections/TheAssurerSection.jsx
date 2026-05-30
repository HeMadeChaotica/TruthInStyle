import '../../styles/sections/the-assurer.css';

const ASSURER_WIDGETS = [
  { number: '01', className: 'assurer-title-cluster', label: 'TITLE / DATE', sample: 'Daily receiver' },
  { number: '02', className: 'assurer-macro-bars', label: 'DA.EATER MACROS', sample: 'Static placement only' },
  { number: '03', className: 'assurer-battle-cry-tile', label: 'BATTLE CRY', sample: 'Review tile' },
  { number: '04', className: 'assurer-weather-tile', label: 'WEATHER', sample: 'Review tile' },
  { number: '05', className: 'assurer-meal-log', label: 'MEAL LOG', sample: 'Review panel' },
  { number: '06', className: 'assurer-body-sleep-water', label: 'BODY / SLEEP / WATER', sample: 'Review panel' },
  { number: '07', className: 'assurer-word-panel', label: 'WORD + DEFINITION', sample: 'Review panel' },
  { number: '08', className: 'assurer-daily-orbit', label: 'DAILY ORBIT', sample: 'Review strip' },
  { number: '09', className: 'assurer-media-strip', label: 'MEDIA STRIP', sample: 'Review strip' },
  { number: '10', className: 'assurer-week-strip', label: 'WEEK STRIP', sample: 'Review strip' },
  { number: '11', className: 'assurer-metric-strip', label: 'METRICS', sample: 'Review strip' },
  { number: '12', className: 'assurer-day-timeline', label: 'DAY TIMELINE', sample: 'Review panel' },
  { number: '13', className: 'assurer-moment-flip-cards', label: 'WOW / WTF / PLOT TWIST', sample: 'Review cards' },
  { number: '14', className: 'assurer-assured-thoughts', label: 'ASSURED THOUGHTS', sample: 'Review panel' }
];

export default function TheAssurerSection() {
  return (
    <section className="assurer-oracle-shell" aria-label="THE.ASSURER oracle board">
      <div className="assurer-oracle-stage">
        <img
          className="assurer-scene"
          src="/backgrounds/THE-ASSURER/the-assurer-bg-v2.PNG"
          alt=""
          aria-hidden="true"
        />
        <div className="assurer-widget-layer">
          {ASSURER_WIDGETS.map((widget) => (
            <article key={widget.number} className={`assurer-widget ${widget.className}`}>
              <span className="assurer-widget-number">{widget.number}</span>
              <strong>{widget.label}</strong>
              <small>{widget.sample}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
