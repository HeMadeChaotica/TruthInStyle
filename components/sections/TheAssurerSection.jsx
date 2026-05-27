'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/the-assurer.css';
import '../../styles/sections/thicc-fitt.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { getDailyAssurerWord, getAssurerWeather, searchHeadHummer, selectHeadHummer } from '../../src/services/assurerService';

const toCaps = (v) => String(v || '').toUpperCase();
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

const DROPDOWN_KEYS = {
  assessmentMood: 'assessmentMood',
  assessmentEra: 'assessmentEra',
  assessmentSingleness: 'assessmentSingleness',
  lobitoCheckIn: 'lobitoCheckIn'
};

const dropdownMap = {
  [DROPDOWN_KEYS.assessmentMood]: () => optionRegistry.assessment?.mood || [],
  [DROPDOWN_KEYS.assessmentEra]: () => optionRegistry.assessment?.era || [],
  [DROPDOWN_KEYS.assessmentSingleness]: () => optionRegistry.assessment?.singlenessLevel || [],
  [DROPDOWN_KEYS.lobitoCheckIn]: () => optionRegistry.assessment?.libidoCheckIn || []
};

function useDropdownOptions(key) {
  return useMemo(() => dropdownMap[key]?.() || [], [key]);
}

function buildAssurerWandPayload(data) {
  return {
    titleOfDay: data.titleOfDay,
    mood: data.mood,
    era: data.era,
    singlenessLevel: data.singlenessLevel,
    lobitoCheckIn: data.lobitoCheckIn,
    locationWeather: data.locationWeather,
    headHummer: data.headHummer,
    wordOfDay: data.wordOfDay,
    definition: data.definition,
    assuredThoughts: data.assuredThoughts,
    sourceSignals: {}
  };
}

const SOURCE_MIRROR_READINESS = {
  daEater: ['EXACT FLASH/SHIMMER PROGRESS BARS', 'MEAL ROW STYLE', 'THICC.TREAT CONDITIONAL'],
  thiccFitt: ['BATTLE CRY STYLE', 'EXERCISE LOG SUMMARY STYLE', 'SO HOW YOU DOIN TAKE 🫪⁉️', 'TROPHY WALL MEDIA STYLE', 'UPUP JUICE AVERAGE', 'SLEEP TOTAL'],
  rememberMe: ['3-DAY EVENTS', 'WOW / WTF / PLOT TWIST FLIP CARDS'],
  thiccTime: ['7-DAY VIEW CURRENT DAY + 6', 'MISTA.THICC', 'ALL THREE LAYERS', 'TOTAL CLIENTS']
};

export default function TheAssurerSection() {
  const [titleOfDay, setTitleOfDay] = useState('THE DAILY RECEIVER');
  const [assuredThoughts, setAssuredThoughts] = useState('');
  const [word, setWord] = useState({ word: 'VELVET RUCKUS', definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.' });
  const [weather, setWeather] = useState({ condition: 'NEEDS WEATHER CONNECTION', iconKey: 'CLOUDS' });
  const [location, setLocation] = useState('');
  const [headHummerQuery, setHeadHummerQuery] = useState('');
  const [headHummer, setHeadHummer] = useState(null);

  const moodOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentMood);
  const eraOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentEra);
  const singlenessOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentSingleness);
  const lobitoOptions = useDropdownOptions(DROPDOWN_KEYS.lobitoCheckIn);

  const [mood, setMood] = useState('');
  const [era, setEra] = useState('');
  const [singlenessLevel, setSinglenessLevel] = useState('');
  const [lobitoCheckIn, setLobitoCheckIn] = useState('');

  useEffect(() => {
    setMood((p) => p || moodOptions[0] || '');
    setEra((p) => p || eraOptions[0] || '');
    setSinglenessLevel((p) => p || singlenessOptions[0] || '');
    setLobitoCheckIn((p) => p || lobitoOptions[0] || '');
  }, [moodOptions, eraOptions, singlenessOptions, lobitoOptions]);

  useEffect(() => {
    (async () => {
      const daily = await getDailyAssurerWord();
      setWord({ word: toCaps(daily.word), definition: toCaps(daily.definition) });
    })();
  }, []);

  useEffect(() => { (async () => setWeather(await getAssurerWeather(location)))(); }, [location]);

  const _wandPayload = useMemo(() => buildAssurerWandPayload({
    titleOfDay,
    mood,
    era,
    singlenessLevel,
    lobitoCheckIn,
    locationWeather: `${toCaps(location)} • ${weather.iconKey} • ${toCaps(weather.condition)}`,
    headHummer: headHummer ? `${toCaps(headHummer.title)} • ${toCaps(headHummer.artist)}` : '',
    wordOfDay: word.word,
    definition: word.definition,
    assuredThoughts
  }), [titleOfDay, mood, era, singlenessLevel, lobitoCheckIn, location, weather, headHummer, word, assuredThoughts]);

  return <section className="assurer-shell" aria-label="THE.ASSURER">
    <img className="assurer-scene" src="/background/THE-ASSURER/the-assurer-vampire-king-bg-v1.png" alt="" aria-hidden="true" />
    <div className="assurer-live-layer">
      <aside className="assurer-art-protect" aria-hidden="true" />
      <main className="assurer-content">
        <div className="assurer-panel truth-shimmer-border">
          <input className="assurer-title-input" value={titleOfDay} onChange={(e) => setTitleOfDay(toCaps(e.target.value))} />
          <div className="assurer-date">{fmt(Date.now())}</div>
        </div>

        <div className="assurer-panel truth-shimmer-border assurer-grid">
          <label>MOOD<select value={mood} onChange={(e) => setMood(e.target.value)}>{moodOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>ERA<select value={era} onChange={(e) => setEra(e.target.value)}>{eraOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>SINGLENESS LEVEL<select value={singlenessLevel} onChange={(e) => setSinglenessLevel(e.target.value)}>{singlenessOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>LOBITO CHECK-IN<select value={lobitoCheckIn} onChange={(e) => setLobitoCheckIn(e.target.value)}>{lobitoOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>LOCATION + WEATHER<input value={location} onChange={(e) => setLocation(toCaps(e.target.value))} placeholder="TYPE LOCATION" /><small>{weather.iconKey} • {toCaps(weather.condition)}</small></label>
          <label>HEAD HUMMER<input value={headHummerQuery} onChange={async (e) => { const q = toCaps(e.target.value); setHeadHummerQuery(q); const t = await searchHeadHummer(q); if (t) setHeadHummer(selectHeadHummer(t)); }} placeholder="SONG OR ARTIST" /><small>{headHummer ? `${toCaps(headHummer.title)} • ${toCaps(headHummer.artist)}` : 'NO TRACK SELECTED'}</small></label>
        </div>

        <div className="assurer-panel truth-shimmer-border tf30-quote-panel">
          <h3>WORD OF THE DAY</h3>
          <div className="tf30-war-cry-frame">
            <p><strong>WORD:</strong> <input value={word.word} onChange={(e) => setWord((p) => ({ ...p, word: toCaps(e.target.value) }))} /></p>
            <p><strong>DEFINITION:</strong> <textarea value={word.definition} onChange={(e) => setWord((p) => ({ ...p, definition: toCaps(e.target.value) }))} /></p>
          </div>
        </div>

        <div className="assurer-panel truth-shimmer-border assurer-mirror-slot">
          <h3>SOURCE MIRROR SLOTS — READY ONLY</h3>
          <p>NO GENERIC OR FAKE MIRRORS RENDERED IN THIS CONTAINMENT PASS.</p>
        </div>

        <label className="assurer-panel truth-shimmer-border assurer-thoughts-panel">ASSURED THOUGHTS<textarea className="assurer-thoughts" value={assuredThoughts} onChange={(e) => setAssuredThoughts(toCaps(e.target.value))} /></label>
      </main>
    </div>
  </section>;
}

export { SOURCE_MIRROR_READINESS, DROPDOWN_KEYS, useDropdownOptions, buildAssurerWandPayload };
