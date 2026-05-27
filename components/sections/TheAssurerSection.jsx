'use client';

import { useMemo, useState } from 'react';
import '../../styles/sections/the-assurer.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';

const DROPDOWN_KEYS = {
  assessmentMood: 'mood',
  assessmentEra: 'era',
  assessmentSingleness: 'singlenessLevel',
};

const useDropdownOptions = (key) => optionRegistry.assessment?.[key] || [];
const toCaps = (value) => value.toUpperCase();

const PROGRESS_ITEMS = [
  { label: 'PROTEIN', value: 72 },
  { label: 'CARBS', value: 64 },
  { label: 'FATS', value: 58 },
  { label: 'CALORIES', value: 80 },
  { label: 'WATER', value: 69 },
];

export default function TheAssurerSection() {
  const moodOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentMood);
  const eraOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentEra);
  const singlenessOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentSingleness);

  const [titleOfDay, setTitleOfDay] = useState('');
  const [mood, setMood] = useState(moodOptions[0] || '');
  const [era, setEra] = useState(eraOptions[0] || '');
  const [singlenessLevel, setSinglenessLevel] = useState(singlenessOptions[0] || '');
  const [location, setLocation] = useState('');
  const [headHummer, setHeadHummer] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [wordOfDay, setWordOfDay] = useState('');
  const [definition, setDefinition] = useState('');
  const [assuredThoughts, setAssuredThoughts] = useState('');

  const progress = useMemo(() => PROGRESS_ITEMS, []);

  return (
    <section className="assurer-shell" aria-label="THE.ASSURER">
      <img className="assurer-scene" src="/backgrounds/THE-ASSURER/the-assurer-vampire-king-bg-v1.PNG" alt="" aria-hidden="true" />

      <div className="assurer-live-layer">
        <div className="assurer-content">
          <div className="assurer-card">
            <input
              className="assurer-title-input"
              value={titleOfDay}
              onChange={(e) => setTitleOfDay(toCaps(e.target.value))}
              placeholder="TITLE OF THE DAY"
              aria-label="TITLE OF THE DAY"
            />

            <div className="assurer-progress-stack" aria-label="Daily progress placeholders">
              {progress.map((item) => (
                <div className="assurer-progress-row" key={item.label}>
                  <span className="assurer-progress-label">{item.label}</span>
                  <div className="assurer-progress-track">
                    <span className="assurer-progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="assurer-grid-3">
              <label>
                MOOD
                <select value={mood} onChange={(e) => setMood(toCaps(e.target.value))}>
                  {moodOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                ERA
                <select value={era} onChange={(e) => setEra(toCaps(e.target.value))}>
                  {eraOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                SINGLENESS LEVEL
                <select value={singlenessLevel} onChange={(e) => setSinglenessLevel(toCaps(e.target.value))}>
                  {singlenessOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="assurer-grid-2">
              <label>
                LOCATION
                <input value={location} onChange={(e) => setLocation(toCaps(e.target.value))} placeholder="ENTER LOCATION" />
              </label>
              <label>
                HEAD HUMMER
                <input value={headHummer} onChange={(e) => setHeadHummer(toCaps(e.target.value))} placeholder="SONG / ARTIST" />
              </label>
            </div>

            <label>
              SPOTIFY URL (OPTIONAL)
              <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder="https://..." />
            </label>

            <div className="assurer-grid-2">
              <label>
                WORD OF THE DAY
                <input value={wordOfDay} onChange={(e) => setWordOfDay(toCaps(e.target.value))} placeholder="WORD" />
              </label>
              <label>
                DEFINITION
                <textarea value={definition} onChange={(e) => setDefinition(toCaps(e.target.value))} rows={3} placeholder="DEFINITION" />
              </label>
            </div>

            <label className="assurer-thoughts-wrap">
              ASSURED THOUGHTS
              <textarea
                className="assurer-thoughts"
                value={assuredThoughts}
                onChange={(e) => setAssuredThoughts(toCaps(e.target.value))}
                placeholder="WRITE HERE"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
