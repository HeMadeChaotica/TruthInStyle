'use client';

import { ArtLane, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import '../../styles/sections/hopewood.css';

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-bg.png';

export default function HopewoodSection() {
  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood archive viewer">
      <ScenePlate className="hopewood-scene-plate">
        <img className="hopewood-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" />
      </ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <ArtLane className="hopewood-left" aria-label="Hopewood lookup and art reserve" />
        <ContentScroller className="hopewood-book-space" aria-label="Open Book of Life viewing space" />
      </SectionOverlay>
    </SectionShell>
  );
}
