'use client';

import { ScenePlate, SectionShell } from '../shared/UniversalSectionFrame';
import '../../styles/sections/525600.css';

const BACKGROUND_URL = '/backgrounds/525600/525600-bg.png';
const FEED_ZONES = [
  'YEARLY PATTERNS',
  'NORMALIZED SOURCE DATA',
  'HOPEWOOD METADATA',
  'TREND INTELLIGENCE',
];

export default function Annual525600Section() {
  return (
    <SectionShell className="annual525600-page" aria-label="525600 annual review and yearly trend intelligence">
      <ScenePlate className="annual525600-scene-plate">
        <img className="annual525600-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" />
      </ScenePlate>
      <main className="annual525600-feed-grid" aria-label="525600 yearly intelligence feed zones">
        {FEED_ZONES.map((label) => (
          <section className="annual525600-feed-zone" key={label} aria-label={label}>
            <h2>{label}</h2>
          </section>
        ))}
      </main>
    </SectionShell>
  );
}
