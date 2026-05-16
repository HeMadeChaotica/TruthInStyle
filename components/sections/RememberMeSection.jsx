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

const MONTH_VISUAL_CONFIG = {
  0: { showLargeMonthLabel: false, backgroundPosition: 'left 32% center' },
  1: { showLargeMonthLabel: false, backgroundPosition: 'left 29% center' },
  2: { showLargeMonthLabel: false, backgroundPosition: 'left 30% center' },
  3: { showLargeMonthLabel: false, backgroundPosition: 'left 28% center' },
  4: { showLargeMonthLabel: false, backgroundPosition: 'left 31% center' },
  5: { showLargeMonthLabel: false, backgroundPosition: 'left 30% center' },
  6: { showLargeMonthLabel: false, backgroundPosition: 'left 29% center' },
  7: { showLargeMonthLabel: false, backgroundPosition: 'left 30% center' },
  8: { showLargeMonthLabel: false, backgroundPosition: 'left 28% center' },
  9: { showLargeMonthLabel: false, backgroundPosition: 'left 29% center' },
  10: { showLargeMonthLabel: false, backgroundPosition: 'left 28% center' },
  11: { showLargeMonthLabel: false, backgroundPosition: 'left 31% center' }
};

const REMEMBER_ME_OBSERVANCES = [
  { id: 'national-pizza-day', month: 1, day: 9, label: 'PIZZA', fullName: 'National Pizza Day', mood: 'food' },
  { id: 'aunt-and-uncle-day', month: 6, day: 26, label: 'AUNT+UNCLE', fullName: 'Aunt and Uncle Day', mood: 'family' },
  { id: 'national-wing-day', month: 6, day: 29, label: 'WINGS', fullName: 'National Chicken Wing Day', mood: 'food' },
  { id: 'national-boyfriend-day', month: 9, day: 3, label: 'BOYFRIEND', fullName: 'National Boyfriend Day', mood: 'love' },
  { id: 'national-cookie-day', month: 11, day: 4, label: 'COOKIE', fullName: 'National Cookie Day', mood: 'food' }
];

const PS_TYPES = [
  'SOMETHING NEW DAY', 'APPOINTMENT', 'REMINDER', 'JOB INTERVIEW', 'BIRTHDAY', 'ANNIVERSARY',
  'MEETING DEADLINE', 'EVENT', 'TRAVEL', 'CALL', 'WORKOUT', 'SOCIAL', 'PERSONAL', 'HEALTH', 'FINANCE'
];

const MOMENT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toDateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false, dateKey: toDateKey(year, month - 1, daysInPrevMonth - i) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, inMonth: true, dateKey: toDateKey(year, month, day) });
  }

  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing, inMonth: false, dateKey: toDateKey(year, month + 1, trailing) });
    trailing += 1;
  }

  return cells;
}

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentsByDate, setMomentsByDate] = useState({});
  const [activeMomentByDate, setActiveMomentByDate] = useState({});
  const [entryDraft, setEntryDraft] = useState({ type: PS_TYPES[0], time: '', detail: '', description: '' });
  const [momentDraft, setMomentDraft] = useState({ type: 'WOW', time: '', description: '', mediaRef: '' });

  const monthIndex = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const monthBackground = MONTH_BACKGROUND_BY_INDEX[monthIndex];
  const monthVisual = MONTH_VISUAL_CONFIG[monthIndex] ?? { showLargeMonthLabel: false, backgroundPosition: 'left 30% center' };
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const selectedDateKey = toDateKey(year, monthIndex, selectedDay);
  const todayKey = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const selectedObservances = useMemo(() => REMEMBER_ME_OBSERVANCES.filter((o) => o.month === monthIndex && o.day === selectedDay), [monthIndex, selectedDay]);

  const bgStyle = {
    '--remember-bg-image': `url('/backgrounds/REMEMBER-ME/${monthBackground}')`,
    '--remember-bg-position': monthVisual.backgroundPosition
  };

  const stepMonth = (dir) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + dir, 1));
    setSelectedDay(1);
  };

  const saveEntry = () => {
    const payload = { ...entryDraft, id: crypto.randomUUID() };
    setEntriesByDate((current) => ({ ...current, [selectedDateKey]: [...(current[selectedDateKey] ?? []), payload] }));
    setEntryDraft((draft) => ({ ...draft, time: '', detail: '', description: '' }));
  };

  const addOrUpdateMoment = (forcedType) => {
    const nextType = forcedType ?? momentDraft.type;
    const draft = { ...momentDraft, type: nextType };
    const dayMoments = momentsByDate[selectedDateKey] ?? [];
    const activeId = activeMomentByDate[selectedDateKey];

    if (activeId) {
      setMomentsByDate((current) => ({
        ...current,
        [selectedDateKey]: (current[selectedDateKey] ?? []).map((moment) => (moment.id === activeId ? { ...moment, ...draft } : moment))
      }));
    } else if (dayMoments.length < 3) {
      const newMoment = { id: crypto.randomUUID(), ...draft, stamped: false };
      setMomentsByDate((current) => ({ ...current, [selectedDateKey]: [...(current[selectedDateKey] ?? []), newMoment] }));
      setActiveMomentByDate((current) => ({ ...current, [selectedDateKey]: newMoment.id }));
    }
  };

  const stampActiveMoment = () => {
    const activeId = activeMomentByDate[selectedDateKey];
    if (!activeId) return;
    setMomentsByDate((current) => ({
      ...current,
      [selectedDateKey]: (current[selectedDateKey] ?? []).map((moment) => (moment.id === activeId ? { ...moment, stamped: true } : moment))
    }));
  };

  const selectedEntries = entriesByDate[selectedDateKey] ?? [];
  const selectedMoments = momentsByDate[selectedDateKey] ?? [];

  const addObservanceToPS = (observance) => {
    setEntryDraft((draft) => ({ ...draft, detail: observance.fullName }));
  };

  const dayLabel = new Date(`${selectedDateKey}T00:00:00`).toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
  const assurerPayloadPreview = {
    source: 'REMEMBER.ME',
    date: selectedDateKey,
    dayLabel,
    calendarEntries: selectedEntries,
    observances: selectedObservances.map(({ id, label, fullName }) => ({ id, label, fullName })),
    moments: selectedMoments.filter((moment) => moment.stamped).map((moment) => ({ ...moment, stamped: true }))
  };

  return (
    <section className="remember-page" style={bgStyle}>
      <div className="remember-overlay" aria-hidden="true" />
      <div className="remember-content">
        <header className="remember-head"><h1>REMEMBER.ME</h1></header>
        <main className="remember-main">
          <section className="remember-calendar-panel" aria-label="Month calendar">
            <div className="remember-month-row">
              <button type="button" onClick={() => stepMonth(-1)} aria-label="Previous month">‹</button>
              <h2 className="remember-sr-only">{monthName} {year}</h2>
              {!monthVisual.showLargeMonthLabel && <span className="remember-month-mini">{monthName} {year}</span>}
              <button type="button" onClick={() => stepMonth(1)} aria-label="Next month">›</button>
            </div>
            <div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="remember-grid">
              {monthGrid.map((cell, idx) => {
                const cellEntries = entriesByDate[cell.dateKey] ?? [];
                const cellMoments = momentsByDate[cell.dateKey] ?? [];
                const cellObservances = REMEMBER_ME_OBSERVANCES.filter((o) => {
                  const [y, m, d] = cell.dateKey.split('-').map(Number);
                  return o.month === m - 1 && o.day === d;
                });
                const chips = [
                  ...cellObservances.map((o) => ({ tone: 'observance', label: o.label })),
                  ...cellEntries.map((e) => ({ tone: 'entry', label: e.type.replace('MEETING DEADLINE', 'DEADLINE') })),
                  ...cellMoments.map((m) => ({ tone: 'moment', label: m.type }))
                ];
                const visibleChips = chips.slice(0, 3);
                const hiddenCount = Math.max(0, chips.length - 3);
                const isToday = cell.dateKey === todayKey;

                return (
                  <button
                    key={`${idx}-${cell.day}`}
                    type="button"
                    className={`remember-day ${cell.inMonth ? '' : 'remember-outside'} ${cell.inMonth && selectedDay === cell.day ? 'remember-selected' : ''} ${isToday ? 'remember-today' : ''}`.trim()}
                    onClick={() => cell.inMonth && setSelectedDay(cell.day)}
                    disabled={!cell.inMonth}
                  >
                    <span className="remember-day-num">{cell.day}</span>
                    <span className="remember-day-chips">
                      {visibleChips.map((chip, chipIndex) => <span key={`${chip.tone}-${chip.label}-${chipIndex}`} className={`remember-chip remember-chip-${chip.tone}`}>{chip.label}</span>)}
                      {hiddenCount > 0 && <span className="remember-chip remember-chip-more">+{hiddenCount}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="remember-rail" aria-label="Right glyph rail">
            <button type="button" onClick={() => addOrUpdateMoment('WOW')}>WOW</button>
            <button type="button" onClick={() => addOrUpdateMoment('PLOT TWIST')}>PLOT TWIST</button>
            <button type="button" onClick={() => addOrUpdateMoment('WTF')}>WTF</button>
            <button type="button" onClick={stampActiveMoment}>STAMP IT</button>
          </aside>
        </main>

        <section className="remember-editor" aria-label="Day postcard editor">
          <h3>{selectedDateKey} · {dayLabel}</h3>
          <div className="remember-editor-grid">
            <div className="remember-card">
              <h4>P.S.</h4>
              <select value={entryDraft.type} onChange={(e) => setEntryDraft((d) => ({ ...d, type: e.target.value }))}>
                {PS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input type="time" value={entryDraft.time} onChange={(e) => setEntryDraft((d) => ({ ...d, time: e.target.value }))} />
              <input type="text" placeholder="short detail" value={entryDraft.detail} onChange={(e) => setEntryDraft((d) => ({ ...d, detail: e.target.value }))} />
              <textarea placeholder="description" value={entryDraft.description} onChange={(e) => setEntryDraft((d) => ({ ...d, description: e.target.value }))} />
              <button type="button" onClick={saveEntry}>SAVE</button>
            </div>
            <div className="remember-card">
              <h4>MOMENTS</h4>
              <select value={momentDraft.type} onChange={(e) => setMomentDraft((d) => ({ ...d, type: e.target.value }))}>
                {MOMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input type="time" value={momentDraft.time} onChange={(e) => setMomentDraft((d) => ({ ...d, time: e.target.value }))} />
              <textarea placeholder="moment description" value={momentDraft.description} onChange={(e) => setMomentDraft((d) => ({ ...d, description: e.target.value }))} />
              <input type="text" placeholder="optional mediaRef" value={momentDraft.mediaRef} onChange={(e) => setMomentDraft((d) => ({ ...d, mediaRef: e.target.value }))} />
              <button type="button" onClick={() => addOrUpdateMoment()}>SAVE MOMENT</button>
              <small>MAX 3 MOMENTS / DAY · STAMPED ONLY FEED THE.ASSURER</small>
            </div>
            <div className="remember-card">
              <h4>OBSERVANCES</h4>
              {selectedObservances.length === 0 && <p>NO FUN NATIONAL DAY MARKERS FOR THIS DATE.</p>}
              {selectedObservances.map((observance) => (
                <div key={observance.id} className="remember-observance-row">
                  <span className="remember-chip remember-chip-observance">{observance.label}</span>
                  <span>{observance.fullName}</span>
                  <button type="button" onClick={() => addObservanceToPS(observance)}>ADD TO P.S.</button>
                </div>
              ))}
              <pre>{JSON.stringify(assurerPayloadPreview, null, 2)}</pre>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
