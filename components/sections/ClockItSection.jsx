'use client';

import '../../styles/sections/clock-it.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';


const PANEL_ROWS = [
  {
    title: 'DROPDOWN HEADQUARTERS',
    panels: [
      { title: 'THICC.FITT DROPDOWNS', items: [['ROID SEASON', ...optionRegistry.thiccFitt.roidSeason], ['WORKOUT LENGTH', ...optionRegistry.thiccFitt.roidWorkoutDuration], ['CARDIO TYPE', ...optionRegistry.thiccFitt.roidCardioType], ['CARDIO DURATION', ...optionRegistry.thiccFitt.roidCardioDuration], ['COMPOUND', ...optionRegistry.thiccFitt.roidCompound], ['ESTER / FORM', ...optionRegistry.thiccFitt.roidEster], ['AMOUNT', ...optionRegistry.thiccFitt.roidAmount], ['ESTROGEN SENSITIVITY', ...optionRegistry.thiccFitt.roidSensitivity], ['SO HOW YOU DOIN 🫪⁉️', ...optionRegistry.thiccFitt.soHowYouDoin]] },
      { title: 'THE.ASSURER LOOKUPS', items: [['MOOD', ...optionRegistry.assessment.mood], ['ERA', ...optionRegistry.assessment.era], ['SINGLENESS LEVEL', ...optionRegistry.assessment.singlenessLevel], ['LOBITO CHECK-IN', ...optionRegistry.assessment.libidoCheckIn]] },
      { title: 'REMEMBER.ME (FUTURE SOURCE)', items: [['P.S. TYPES', ...optionRegistry.rememberMeFuture.psTypes], ['MOMENT TYPES', ...optionRegistry.rememberMeFuture.momentTypes]] },
      { title: 'THICC.FITT QUOTE FAMILY', items: [['THICC.FITT QUOTE FAMILY', ...optionRegistry.thiccFitt.quoteOfDay]] }
    ]
  }
];

export default function ClockItSection() {
  return (
    <section className="clockit-page">
      <div className="clockit-layout">
        <aside className="clockit-art" aria-hidden="true" />
        <main className="clockit-controls">
          {PANEL_ROWS.map((row) => (
            <section key={row.title} className="clockit-row">
              <h2>{row.title}</h2>
              <div className="clockit-grid">
                {row.panels.map((panel) => (
                  <article key={panel.title} className="clockit-panel">
                    <h3>{panel.title}</h3>
                    <div className="clockit-list">
                      {panel.items.map(([family, ...values]) => (
                        <label key={family}>
                          <span>{family}</span>
                          <select defaultValue={(values[0] && (values[0].text || values[0])) || ''}>{values.map((v) => { const value = v?.text || v; const key = v?.id || value; return <option key={key}>{value}</option>; })}</select>
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </section>
  );
}
