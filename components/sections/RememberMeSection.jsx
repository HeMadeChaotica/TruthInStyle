'use client';

import { useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

const MONTH_BACKGROUND_BY_INDEX = {
  0: 'remember-me-01-january-new-year-bg.png',
  1: 'remember-me-02-february-valentine-bg.png',
  2: 'remember-me-03-march-steak-and-bj-day-bg.png',
  3: 'remember-me-04-april-spring-bg.png',
  4: 'remember-me-05-may-summer-loading-bg.png',
  5: 'remember-me-06-june-pride-bg.png',
  6: 'remember-me-07-july-hotter-than-your-ex-bg.png',
  7: 'remember-me-08-august-peak-thicc-bg.png',
  8: 'remember-me-09-september-back-to-business-bg.png',
  9: 'remember-me-10-october-spooky-sexy-bg.png',
  10: 'remember-me-11-november-feast-bg.png',
  11: 'remember-me-12-december-mista-thicc-birthday-bg.png'
};

const MONTH_VISUAL_CONFIG = Object.fromEntries(Array.from({ length: 12 }, (_, month) => [month, { showLargeMonthLabel: false, backgroundPosition: 'left 28% center', backgroundSize: 'contain' }]));
const EVENT_TYPES = ['SOMETHING NEW DAY', 'APPOINTMENT', 'REMINDER', 'JOB INTERVIEW', 'BIRTHDAY', 'ANNIVERSARY', 'MEETING DEADLINE', 'EVENT', 'TRAVEL', 'CALL', 'WORKOUT', 'SOCIAL', 'PERSONAL', 'HEALTH', 'FINANCE'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const REMEMBER_ME_OBSERVANCES = [
  { id: 'feb-pizza', month: 1, day: 9, chip: 'PIZZA', title: 'National Pizza Day', funFact: 'Pizza became one of America\'s favorite comfort foods after Italian immigrants popularized it.', assurerReflection: 'Comfort food and comfort chaos can both be valid coping strategies.', tone: 'FUNNY' },
  { id: 'mar-steakb', month: 2, day: 14, chip: 'STEAK+B', title: 'Steak and BJ Day', funFact: 'A modern cheeky observance that spread online as a tongue-in-cheek holiday.', assurerReflection: 'Reminder: humor plus consent equals memorable fun.', tone: 'SPICY' },
  { id: 'june-pride', month: 5, day: null, allMonth: true, chip: 'PRIDE', title: 'Pride Month', funFact: 'Pride honors LGBTQ+ history and protest roots while celebrating identity and joy.', assurerReflection: 'Lead with joy, protect your people, and keep your boundaries sacred.', tone: 'PRIDE' },
  { id: 'oct-halloween', month: 9, day: 31, chip: 'HALLOWEEN', title: 'Halloween', funFact: 'Halloween evolved from ancient festivals and became a giant costume tradition.', assurerReflection: 'Costume confidence is still confidence; own the bit.', tone: 'CHAOS' }
];

const toDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const buildMonthGrid = (v) => { const y = v.getFullYear(), m = v.getMonth(), f = new Date(y, m, 1), w = f.getDay(), dim = new Date(y, m + 1, 0).getDate(), dip = new Date(y, m, 0).getDate(), cells = []; for (let i = w - 1; i >= 0; i--) cells.push({ day: dip - i, inMonth: false, dateKey: toDateKey(y, m - 1, dip - i) }); for (let d = 1; d <= dim; d++) cells.push({ day: d, inMonth: true, dateKey: toDateKey(y, m, d) }); for (let t = 1; cells.length % 7 !== 0; t++) cells.push({ day: t, inMonth: false, dateKey: toDateKey(y, m + 1, t) }); return cells; };

const emptyEventDraft = { eventType: EVENT_TYPES[0], time: '', location: '', description: '' };
const emptyStandoutDraft = { standoutType: STANDOUT_TYPES[0], time: '', location: '', description: '', photoRef: '' };

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [postcardMode, setPostcardMode] = useState('EVENT');
  const [eventsByDate, setEventsByDate] = useState({});
  const [standoutsByDate, setStandoutsByDate] = useState({});
  const [eventDraft, setEventDraft] = useState(emptyEventDraft);
  const [standoutDraft, setStandoutDraft] = useState(emptyStandoutDraft);

  const monthIndex = viewDate.getMonth(), year = viewDate.getFullYear(), monthName = viewDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const monthVisual = MONTH_VISUAL_CONFIG[monthIndex];
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const selectedDateKey = toDateKey(year, monthIndex, selectedDay);

  const selectedObservances = useMemo(() => REMEMBER_ME_OBSERVANCES.filter((o) => o.month === monthIndex && (o.allMonth || o.day === selectedDay)), [monthIndex, selectedDay]);
  const standoutPostcards = useMemo(() => Object.entries(standoutsByDate).flatMap(([date, list]) => list.map((s) => ({ date, standout: s }))).filter(({ date }) => date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}`)), [standoutsByDate, year, monthIndex]);

  const onDayClick = (day) => { setSelectedDay(day); setPostcardMode('EVENT'); setPostcardOpen(true); setEventDraft(emptyEventDraft); setStandoutDraft(emptyStandoutDraft); };
  const closePostcard = () => setPostcardOpen(false);

  const saveEvent = () => {
    const payload = { id: crypto.randomUUID(), date: selectedDateKey, mode: 'EVENT', ...eventDraft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setEventsByDate((c) => ({ ...c, [selectedDateKey]: [...(c[selectedDateKey] ?? []), payload] }));
    closePostcard();
  };

  const saveStandout = (stamped = false) => {
    const dayStandouts = standoutsByDate[selectedDateKey] ?? [];
    if (dayStandouts.length >= 3) return;
    const payload = { id: crypto.randomUUID(), date: selectedDateKey, mode: 'STANDOUT', ...standoutDraft, stamped, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setStandoutsByDate((c) => ({ ...c, [selectedDateKey]: [...(c[selectedDateKey] ?? []), payload] }));
    closePostcard();
  };

  const deleteLatestByMode = () => {
    if (postcardMode === 'EVENT') {
      setEventsByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).slice(0, -1) }));
    } else {
      setStandoutsByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).slice(0, -1) }));
    }
    closePostcard();
  };

  return <section className="remember-page" style={{ '--remember-bg-image': `url('/backgrounds/REMEMBER-ME/${MONTH_BACKGROUND_BY_INDEX[monthIndex]}')`, '--remember-bg-position': monthVisual.backgroundPosition, '--remember-bg-size': monthVisual.backgroundSize }}>
    <div className="remember-overlay" aria-hidden="true" />
    <div className="remember-content">
      <header className="remember-head"><h1>REMEMBER.ME</h1></header>
      <main className="remember-main">
        <section className="remember-calendar-panel" aria-label="Month calendar">
          <div className="remember-month-row"><button type="button" onClick={() => { setViewDate((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); setSelectedDay(1); setPostcardOpen(false); }} aria-label="Previous month">‹</button><h2 className="remember-sr-only">{monthName} {year}</h2><span className="remember-month-mini">{monthName} {year}</span><button type="button" onClick={() => { setViewDate((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)); setSelectedDay(1); setPostcardOpen(false); }} aria-label="Next month">›</button></div>
          <div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="remember-grid">{monthGrid.map((cell, idx) => {
            const [_, mm, dd] = cell.dateKey.split('-').map(Number);
            const events = eventsByDate[cell.dateKey] ?? [];
            const standouts = standoutsByDate[cell.dateKey] ?? [];
            const observances = REMEMBER_ME_OBSERVANCES.filter((o) => o.month === mm - 1 && (o.allMonth || o.day === dd));
            const chips = [
              ...standouts.map((s) => ({ tone: s.stamped ? 'stamped' : 'moment', label: s.stamped ? `★ ${s.standoutType}` : s.standoutType })),
              ...events.map((e) => ({ tone: 'entry', label: e.time ? `${e.time} ${e.eventType}` : e.eventType })),
              ...observances.map((o) => ({ tone: 'observance', label: o.chip }))
            ];
            const visible = chips.slice(0, 3);
            const hidden = Math.max(0, chips.length - 3);
            return <button key={`${idx}-${cell.day}`} type="button" className={`remember-day ${cell.inMonth ? '' : 'remember-outside'} ${cell.inMonth && selectedDay === cell.day ? 'remember-selected' : ''}`.trim()} onClick={() => cell.inMonth && onDayClick(cell.day)} disabled={!cell.inMonth}><span className="remember-day-num">{cell.day}</span><span className="remember-day-chips">{visible.map((chip, i) => <span key={`${chip.label}-${i}`} className={`remember-chip remember-chip-${chip.tone}`}>{chip.label}</span>)}{hidden > 0 && <span className="remember-chip remember-chip-more">+{hidden}</span>}</span></button>;
          })}</div>
        </section>

        <section className="remember-postcards-pane"><h3>STANDOUT POSTCARDS</h3>{standoutPostcards.length === 0 ? <p>Saved and stamped standouts for this month will appear here.</p> : standoutPostcards.map(({ date, standout }) => <article key={standout.id} className="remember-postcard"><span>{date}</span><strong>{standout.standoutType}</strong><p>{standout.description || 'Stamped memory.'}</p>{standout.photoRef && <small>{standout.photoRef}</small>}{standout.stamped && <em>STAMPED</em>}</article>)}</section>
      </main>

      {postcardOpen && <div className="remember-popout-wrap" role="dialog" aria-modal="true"><section className="remember-popout"><header><h3>{selectedDateKey}</h3><div className="remember-type-switch"><span>TYPE:</span><button type="button" className={postcardMode === 'EVENT' ? 'active' : ''} onClick={() => setPostcardMode('EVENT')}>EVENT</button><button type="button" className={postcardMode === 'STANDOUT' ? 'active' : ''} onClick={() => setPostcardMode('STANDOUT')}>STANDOUT</button></div></header>
        {selectedObservances.length > 0 && <div className="remember-observance-strip">{selectedObservances.map((o) => <article key={o.id} className="remember-sticky"><strong>{o.title}</strong><p>Fun fact: {o.funFact}</p><small>{o.assurerReflection}</small></article>)}</div>}

        {postcardMode === 'EVENT' ? <div className="remember-form"><select value={eventDraft.eventType} onChange={(e) => setEventDraft((d) => ({ ...d, eventType: e.target.value }))}>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><input type="text" value={selectedDateKey} disabled /><input type="time" value={eventDraft.time} onChange={(e) => setEventDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="Location" value={eventDraft.location} onChange={(e) => setEventDraft((d) => ({ ...d, location: e.target.value }))} /><textarea placeholder="Description" value={eventDraft.description} onChange={(e) => setEventDraft((d) => ({ ...d, description: e.target.value }))} /><div className="remember-actions"><button type="button" onClick={saveEvent}>SAVE</button><button type="button" onClick={deleteLatestByMode}>DELETE</button><button type="button" onClick={closePostcard}>CLOSE</button></div></div> :
          <div className="remember-form"><select value={standoutDraft.standoutType} onChange={(e) => setStandoutDraft((d) => ({ ...d, standoutType: e.target.value }))}>{STANDOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><input type="text" value={selectedDateKey} disabled /><input type="time" value={standoutDraft.time} onChange={(e) => setStandoutDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="Location" value={standoutDraft.location} onChange={(e) => setStandoutDraft((d) => ({ ...d, location: e.target.value }))} /><textarea placeholder="Description" value={standoutDraft.description} onChange={(e) => setStandoutDraft((d) => ({ ...d, description: e.target.value }))} /><input type="text" placeholder="Photo (optional)" value={standoutDraft.photoRef} onChange={(e) => setStandoutDraft((d) => ({ ...d, photoRef: e.target.value }))} /><div className="remember-actions"><button type="button" onClick={() => saveStandout(false)}>SAVE</button><button type="button" onClick={() => saveStandout(true)}>STAMP IT</button><button type="button" onClick={deleteLatestByMode}>DELETE</button><button type="button" onClick={closePostcard}>CLOSE</button></div></div>}
      </section></div>}
    </div>
  </section>;
}
