'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/the-assurer.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { getDaEaterDay, prepareDaEaterAssurerPayload } from '../../src/services/daEaterService';
import { loadClients, loadScheduleEntries, groupScheduleEntriesByDate, buildThiccTimeAssurerPayload } from '../../src/services/thiccFittService';
import { fetchRememberMeEntriesSafe } from '../../src/services/rememberMeService';
import { getDailyAssurerWord, getAssurerWeather, searchHeadHummer, selectHeadHummer } from '../../src/services/assurerService';

const toCaps = (v) => String(v || '').toUpperCase();
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

export default function TheAssurerSection() {
  const [titleOfDay, setTitleOfDay] = useState('THE DAILY RECEIVER');
  const [assuredThoughts, setAssuredThoughts] = useState('');
  const [word, setWord] = useState({ word: 'VELVET RUCKUS', definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.', sourceLabel: 'FALLBACK' });
  const [weather, setWeather] = useState({ locationLabel: '', condition: 'NEEDS WEATHER CONNECTION', iconKey: 'CLOUDS' });
  const [location, setLocation] = useState('');
  const [headHummerQuery, setHeadHummerQuery] = useState('');
  const [headHummer, setHeadHummer] = useState(null);
  const [da, setDa] = useState(null);
  const [thiccTime, setThiccTime] = useState({ sevenDayView: [] });
  const [clientCount, setClientCount] = useState(0);
  const [rememberRows, setRememberRows] = useState([]);
  const [moments, setMoments] = useState([]);

  const moodOptions = optionRegistry.assessment?.mood || [];
  const eraOptions = optionRegistry.assessment?.era || [];
  const singlenessOptions = optionRegistry.assessment?.singlenessLevel || [];
  const [mood, setMood] = useState(moodOptions[0] || '');
  const [era, setEra] = useState(eraOptions[0] || '');
  const [singlenessLevel, setSinglenessLevel] = useState(singlenessOptions[0] || '');

  useEffect(() => {
    (async () => {
      const daily = await getDailyAssurerWord();
      setWord({ ...daily, word: toCaps(daily.word), definition: toCaps(daily.definition), sourceLabel: toCaps(daily.sourceLabel || 'LIVE') });
      const todays = new Date().toISOString().slice(0, 10);
      setDa(prepareDaEaterAssurerPayload(getDaEaterDay(todays)));
      const entriesByDate = groupScheduleEntriesByDate(loadScheduleEntries());
      setThiccTime(buildThiccTimeAssurerPayload(entriesByDate, new Date()));
      setClientCount(loadClients().length);
      const rem = await fetchRememberMeEntriesSafe();
      setRememberRows(rem.rows || []);
      const rawMoments = JSON.parse(window.localStorage.getItem('remember_me_standout_moments_v1') || '{}');
      const key = todays;
      setMoments((rawMoments[key] || []).slice(0, 3));
    })();
  }, []);

  useEffect(() => {
    (async () => setWeather(await getAssurerWeather(location)))();
  }, [location]);

  const progressRows = useMemo(() => {
    if (!da) return [];
    return [
      ['PROTEIN', da.macroProgress.protein], ['CARBS', da.macroProgress.carbs], ['FATS', da.macroProgress.fats], ['CALORIES', da.macroProgress.calories], ['WATER', da.macroProgress.waterOz]
    ];
  }, [da]);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return <section className="assurer-shell" aria-label="THE.ASSURER">
    <img className="assurer-scene" src="/background/THE-ASSURER/the-assurer-vampire-king-bg-v1.png" alt="" aria-hidden="true" />
    <div className="assurer-live-layer"><div className="assurer-content">
      <div className="assurer-panel shimmer"><input className="assurer-title-input" value={titleOfDay} onChange={(e) => setTitleOfDay(toCaps(e.target.value))} /><div className="assurer-date">{fmt(Date.now())}</div></div>
      <div className="assurer-panel shimmer">
        {progressRows.map(([label, p]) => <div className="assurer-progress-row" key={label}><span>{label}</span><div className="assurer-progress-track"><i style={{ width: `${Math.min(100, Math.max(0, p || 0))}%` }} /></div><b>{Math.round(p || 0)}%</b></div>)}
      </div>
      <div className="assurer-panel shimmer assurer-grid">
        <label>MOOD<select value={mood} onChange={(e) => setMood(toCaps(e.target.value))}>{moodOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>ERA<select value={era} onChange={(e) => setEra(toCaps(e.target.value))}>{eraOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>SINGLENESS LEVEL<select value={singlenessLevel} onChange={(e) => setSinglenessLevel(toCaps(e.target.value))}>{singlenessOptions.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>LOCATION<input value={location} onChange={(e) => setLocation(toCaps(e.target.value))} placeholder="TYPE LOCATION" /><small>{weather.iconKey} • {toCaps(weather.condition)} {weather.temperature ? `• ${weather.temperature}°` : ''}</small></label>
        <label>HEAD HUMMER<input value={headHummerQuery} onChange={async (e) => { const q = toCaps(e.target.value); setHeadHummerQuery(q); const t = await searchHeadHummer(q); if (t) setHeadHummer(selectHeadHummer(t)); }} placeholder="SONG OR ARTIST" /><small>{headHummer ? `${toCaps(headHummer.title)} • ${toCaps(headHummer.artist)}` : 'NO TRACK SELECTED'}</small></label>
      </div>
      <div className="assurer-panel shimmer assurer-grid2">
        <label>WORD OF THE DAY<input value={word.word} onChange={(e) => setWord((w) => ({ ...w, word: toCaps(e.target.value) }))} /></label>
        <label>DEFINITION<textarea rows={3} value={word.definition} onChange={(e) => setWord((w) => ({ ...w, definition: toCaps(e.target.value) }))} /></label>
      </div>
      <label className="assurer-panel shimmer">ASSURED THOUGHTS<textarea className="assurer-thoughts" value={assuredThoughts} onChange={(e) => setAssuredThoughts(toCaps(e.target.value))} /></label>

      <div className="assurer-panel shimmer"><h3>THICC.TIME 7 DAY VIEW</h3><p>TOTAL NUMBER OF CLIENTS: {clientCount}</p>{(thiccTime.sevenDayView || []).slice(0, 7).map((d) => <div key={d.date} className="line">{d.displayDate} • MISTA.THICC {d.mistaThiccCount} • THE.THICCENS {d.theThiccensCount} • PROSPECTS {d.prospectCount}</div>)}</div>
      <div className="assurer-panel shimmer"><h3>BATTLE CRY</h3><p>MOVE HEAVY. STAY PETTY. STAY PRETTY.</p><p>EXERCISE LOG SUMMARY READY.</p><p>SO HOW YOU DOIN TAKE 🫪⁉️ READY.</p><p>TROPHY WALL PHOTOS BY MEDIA REFERENCES ONLY.</p><p>UPUP JUICE DAILY AVERAGE READY.</p><p>SLEEP TOTAL READY.</p></div>
      <div className="assurer-panel shimmer"><h3>3 DAY EVENTS VIEW</h3>{rememberRows.slice(0, 3).map((r) => <div className="line" key={r.id}>{fmt(r.date_key)} • {toCaps(r.entry_type)} • {toCaps(r.description || r.detail || '')}</div>)}<div className="flip-row">{['WOW', 'WTF', 'PLOT TWIST'].map((type) => { const m = moments.find((x) => toCaps(x.type || x.standoutType) === type); return <button className="flip" key={type}><span>{type}</span><span>{toCaps(m?.description || 'NO MOMENT YET')}</span></button>; })}</div></div>
      <div className="assurer-panel shimmer"><h3>MEAL SIGNALS</h3>{(da?.mealLog || []).map((m) => <div className="line" key={m.id}>{toCaps(m.name)} • {toCaps(m.time)} • P {m.protein || 0} C {m.carbs || 0} F {m.fats || 0} CAL {m.calories || 0}</div>)}{(todayName === 'WEDNESDAY' || todayName === 'SATURDAY') ? <p>THICC.TREAT WINDOW OPEN</p> : null}</div>
    </div></div>
  </section>;
}
