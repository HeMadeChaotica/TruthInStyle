'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/the-assurer.css';
import '../../styles/sections/da-eater.css';
import '../../styles/sections/thicc-fitt.css';
import '../../styles/sections/remember-me.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { getDaEaterDay, prepareDaEaterAssurerPayload } from '../../src/services/daEaterService';
import { loadClients, loadScheduleEntries, groupScheduleEntriesByDate, buildThiccTimeAssurerPayload } from '../../src/services/thiccFittService';
import { fetchRememberMeEntriesSafe } from '../../src/services/rememberMeService';
import { getDailyAssurerWord, getAssurerWeather, searchHeadHummer, selectHeadHummer } from '../../src/services/assurerService';
const toCaps = (v) => String(v || '').toUpperCase();
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

export default function TheAssurerSection() {
const [titleOfDay, setTitleOfDay] = useState('THE DAILY RECEIVER'); const [assuredThoughts, setAssuredThoughts] = useState('');
const [word, setWord] = useState({ word: 'VELVET RUCKUS', definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.' });
const [weather, setWeather] = useState({ condition: 'NEEDS WEATHER CONNECTION', iconKey: 'CLOUDS' }); const [location, setLocation] = useState('');
const [headHummerQuery, setHeadHummerQuery] = useState(''); const [headHummer, setHeadHummer] = useState(null);
const [da, setDa] = useState(null); const [thiccTime, setThiccTime] = useState({ sevenDayView: [] }); const [clientCount, setClientCount] = useState(0);
const [rememberRows, setRememberRows] = useState([]); const [moments, setMoments] = useState([]); const [thiccFitt, setThiccFitt] = useState(null);
const moodOptions = optionRegistry.assessment?.mood || []; const eraOptions = optionRegistry.assessment?.era || []; const singlenessOptions = optionRegistry.assessment?.singlenessLevel || [];
const [mood, setMood] = useState(moodOptions[0] || ''); const [era, setEra] = useState(eraOptions[0] || ''); const [singlenessLevel, setSinglenessLevel] = useState(singlenessOptions[0] || '');
useEffect(() => { (async () => { const daily = await getDailyAssurerWord(); setWord({ word: toCaps(daily.word), definition: toCaps(daily.definition) }); const todays = new Date().toISOString().slice(0, 10); setDa(prepareDaEaterAssurerPayload(getDaEaterDay(todays))); const entriesByDate = groupScheduleEntriesByDate(loadScheduleEntries()); setThiccTime(buildThiccTimeAssurerPayload(entriesByDate, new Date())); setClientCount(loadClients().length); const rem = await fetchRememberMeEntriesSafe(); setRememberRows(rem.rows || []); const rawMoments = JSON.parse(window.localStorage.getItem('remember_me_standout_moments_v1') || '{}'); setMoments((rawMoments[todays] || []).slice(0, 3)); setThiccFitt(JSON.parse(window.localStorage.getItem('thicc_fitt_day') || '{}')); })(); }, []);
useEffect(() => { (async () => setWeather(await getAssurerWeather(location)))(); }, [location]);
const progressRows = useMemo(() => !da ? [] : [['PROTEIN','protein','g'],['CARBS','carbs','g'],['FATS','fats','g'],['CALORIES','calories','cal'],['WATER','waterOz','oz']], [da]);
const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
const todaySleep = thiccFitt?.weeklyTrackers?.byDay?.[new Date().toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()]?.sleep;
return <section className="assurer-shell" aria-label="THE.ASSURER"><img className="assurer-scene" src="/background/THE-ASSURER/the-assurer-vampire-king-bg-v1.png" alt="" aria-hidden="true" />
<div className="assurer-live-layer"><div className="assurer-content">
<div className="assurer-panel truth-shimmer-border"><input className="assurer-title-input" value={titleOfDay} onChange={(e) => setTitleOfDay(toCaps(e.target.value))} /><div className="assurer-date">{fmt(Date.now())}</div></div>
<div className="assurer-panel truth-shimmer-border da-eater-macro-hero">{progressRows.map(([label,key,unit]) => {const p=da?.macroProgress?.[key]||0; const goal=da?.macroTargets?.[key]||0; const current=da?.macroTotals?.[key]||0; return <div className="da-eater-macro-row" key={key}><span>{label}</span><span>GOAL {goal}{unit.toUpperCase()}</span><div className={`da-eater-bar da-eater-bar-${key}`}><div style={{ width: `${Math.min(p,100)}%` }} /></div><span>{p.toFixed?.(0) || 0}%</span><span>{Math.max(goal-current,0).toFixed(0)}{unit.toUpperCase()} LEFT</span></div>;})}</div>
<div className="assurer-panel truth-shimmer-border assurer-grid"><label>MOOD<select value={mood} onChange={(e) => setMood(e.target.value)}>{moodOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>ERA<select value={era} onChange={(e) => setEra(e.target.value)}>{eraOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>SINGLENESS LEVEL<select value={singlenessLevel} onChange={(e) => setSinglenessLevel(e.target.value)}>{singlenessOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>LOCATION<input value={location} onChange={(e) => setLocation(toCaps(e.target.value))} placeholder="TYPE LOCATION" /><small>{weather.iconKey} • {toCaps(weather.condition)}</small></label><label>HEAD HUMMER<input value={headHummerQuery} onChange={async (e) => { const q = toCaps(e.target.value); setHeadHummerQuery(q); const t = await searchHeadHummer(q); if (t) setHeadHummer(selectHeadHummer(t)); }} placeholder="SONG OR ARTIST" /><small>{headHummer ? `${toCaps(headHummer.title)} • ${toCaps(headHummer.artist)}` : 'NO TRACK SELECTED'}</small></label></div>
<div className="assurer-panel truth-shimmer-border tf30-quote-panel"><h3>WORD OF THE DAY</h3><div className="tf30-war-cry-frame"><p><strong>WORD:</strong> {word.word}</p><p><strong>DEFINITION:</strong> {word.definition}</p></div></div>
<div className="assurer-panel truth-shimmer-border"><h3>THICC.TIME 7 DAY VIEW</h3><p>TOTAL NUMBER OF CLIENTS: {clientCount}</p>{(thiccTime.sevenDayView || []).slice(0, 7).map((d) => <div key={d.date} className="line">{d.displayDate} • MISTA.THICC {d.mistaThiccCount} • THE.THICCENS {d.theThiccensCount} • PROSPECTS {d.prospectCount}</div>)}</div>
<div className="assurer-panel truth-shimmer-border tf30-quote-panel"><h3>BATTLE CRY</h3><div className="tf30-war-cry-frame"><blockquote>{toCaps(thiccFitt?.soHowYouDoin || 'MOVE HEAVY. STAY PETTY. STAY PRETTY.')}</blockquote><p>EXERCISE LOG ENTRIES: {(thiccFitt?.exerciseRows || []).filter((r)=>r.exercise).length}</p><p>SO HOW YOU DOIN TAKE 🫪⁉️ {toCaps(thiccFitt?.soHowYouDoinNotes || 'READY')}</p><p>UPUP JUICE DAILY AVERAGE: {Math.round((['SUN','MON','TUE','WED','THU','FRI','SAT'].reduce((s,d)=>s+Number(thiccFitt?.weeklyTrackers?.byDay?.[d]?.caffeineMg||0),0))/7)} MG</p><p>SLEEP TOTAL: {todaySleep?.hoursSlept || 0} HRS</p></div></div>
<div className="assurer-panel truth-shimmer-border"><h3>3 DAY EVENTS VIEW</h3>{rememberRows.slice(0, 3).map((r) => <div className="line" key={r.id}>{fmt(r.date_key)} • {toCaps(r.entry_type)} • {toCaps(r.description || r.detail || '')}</div>)}<div className="flip-row">{['WOW', 'WTF', 'PLOT TWIST'].map((type) => { const m = moments.find((x) => toCaps(x.type || x.standoutType) === type); return <button className="flip assurer-flip-card" key={type}><span>{type}</span><span>{fmt(m?.date || Date.now())} • {toCaps(m?.description || 'NO MOMENT YET')}</span></button>; })}</div></div>
<div className="assurer-panel truth-shimmer-border"><h3>MEAL SIGNALS</h3>{(da?.mealLog || []).map((m) => <div className="line" key={m.id}>{toCaps(m.name)} • {toCaps(m.time)} • P {m.protein || 0} C {m.carbs || 0} F {m.fats || 0} CAL {m.calories || 0}</div>)}{(todayName === 'WEDNESDAY' || todayName === 'SATURDAY') ? <p>THICC.TREAT WINDOW OPEN</p> : null}</div>
<label className="assurer-panel truth-shimmer-border">ASSURED THOUGHTS<textarea className="assurer-thoughts" value={assuredThoughts} onChange={(e) => setAssuredThoughts(toCaps(e.target.value))} /></label>
</div></div></section>; }
