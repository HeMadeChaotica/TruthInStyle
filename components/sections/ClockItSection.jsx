'use client';

import '../../styles/sections/clock-it.css';

const PANEL_ROWS = [
  {
    title: 'DROPDOWN HEADQUARTERS',
    panels: [
      { title: 'THICC.FITT DROPDOWNS', items: ['SO HOW YOU DOIN 🫪⁉️', 'ROID SEASON', 'WORKOUT DURATION', 'CARDIO TYPE', 'CARDIO DURATION', 'COMPOUND', 'ESTER / FORM', 'AMOUNT', 'ESTROGEN SENSITIVITY'] },
      { title: 'ITS.GETTING.THICC DROPDOWNS', items: ['SEX', 'SEXUAL ORIENTATION', 'ACTIVITY LEVEL', 'REFERRAL STATUS', 'TRAINING / REST', 'PROGRAM SPLIT', 'UPCOMING TRAINING EVENT TYPE', 'PAYMENT SCHEDULE', 'FLEXIBILITY LEVEL', 'MARRIED / SINGLE'] },
      { title: 'REMEMBER.ME DROPDOWNS', items: ['MOMENT TYPE', 'P.S. TYPE', 'WOW / WTF / PLOT TWIST TYPE'] },
      { title: 'THE.ASSURER / HOPEWOOD LOOKUPS', items: ['ASSESSMENT MOOD', 'ASSESSMENT ERA', 'ASSESSMENT SINGLENESS', 'LIBIDO CHECK-IN', 'MOOD', 'ERA', 'TOKEN TYPE', 'SOURCE SECTION', 'NORMALIZED VALUE FAMILIES'] }
    ]
  },
  {
    title: 'DA.EATER + MACROS',
    panels: [
      { title: 'DA.EATER MACRO SETTINGS', items: ['MACRO PROFILE / TARGET SET', 'MEAL TYPE', 'FLEX / CHEAT TYPE', 'SUPPLEMENT TYPE', 'HUNGER / CRAVING TYPE'] },
      { title: 'MACRO TARGET SETS', items: ['LEAN MODE TARGETS', 'BULK MODE TARGETS', 'MAINTAIN MODE TARGETS', 'CUT MODE TARGETS'] },
      { title: 'FOOD / MEAL CATEGORY LOOKUPS', items: ['FOOD CATEGORY LOOKUPS', 'MEAL PHOTO TYPE / TAGS', 'PRIMARY MEAL CLASSES', 'SNACK / LIQUID CLASSES'] },
      { title: 'FLEX / CHEAT / SUPPLEMENT OPTION SETS', items: ['FLEX OPTION SETS', 'CHEAT OPTION SETS', 'SUPPLEMENT OPTION SETS', 'STACK / CYCLE LOOKUPS'] }
    ]
  },
  { title: 'SYSTEM MAPS', panels: [{ title: 'ROUTE MAP', items: ['SOURCE TO ROUTE HANDOFFS', 'ROUTE KEY REGISTRY'] }, { title: 'SOURCE FLOW MAP', items: ['FIELD SOURCE OWNERSHIP', 'UPSTREAM DATA PATHS'] }, { title: 'SUMMATION / HOPEWOOD FLOW', items: ['SUMMATION INTEGRATION PATH', 'HOPEWOOD TOKEN MAPPING'] }, { title: 'YEAR / TREND FLOW', items: ['YEARLY NORMALIZATION', 'TREND PIPELINE STATUS'] }] },
  { title: 'REGISTRIES', panels: [{ title: 'OPTION REGISTRY', items: ['OPTION KEYS', 'OPTION LABELS', 'ACTIVE FLAGS'] }, { title: 'SECTION REGISTRY', items: ['SECTION IDs', 'SECTION OWNERS', 'SECTION SLUGS'] }, { title: 'GLYPH / EMBLEM MAPPING', items: ['GLYPH IDs', 'EMBLEM FAMILY', 'ICON SOURCES'] }, { title: 'SYSTEM PANEL METADATA', items: ['PANEL IDS', 'LAST UPDATED', 'DATA SOURCE', 'REFRESH RATE'] }] },
  { title: 'UTILITIES / REPAIR', panels: [{ title: 'REPAIR ACCESS', items: ['RUN PANEL REPAIR', 'RESET DROPDOWN POINTERS', 'REINDEX FAMILIES'] }, { title: 'LABEL / STYLE CONTROL', items: ['LABEL NORMALIZER', 'TEXT CASE ENFORCER', 'SHIMMER EDGE TUNER'] }, { title: 'ADMIN / CORRECTION TOOLS', items: ['ADMIN OVERRIDES', 'CORRECTION BATCH TOOLS', 'ROLLBACK SNAPSHOTS'] }, { title: 'STATUS / SYNC TOOLS', items: ['SYNC STATUS', 'AUTOSAVE HEARTBEAT', 'INTEGRITY CHECKS'] }] }
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
                      {panel.items.map((item) => (
                        <label key={item}>
                          <span>{item}</span>
                          <select defaultValue="">
                            <option value="">EDIT OPTION</option>
                            <option>AUTOSAVE ENABLED</option>
                            <option>REMAP VALUE</option>
                            <option>MARK REVIEW</option>
                          </select>
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
