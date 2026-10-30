'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ChaoticaMonthCalendar, { safeDateKey } from '../shared/ChaoticaMonthCalendar';

const DAY_MS = 24 * 60 * 60 * 1000;
const START_HOUR = 5;
const END_HOUR = 24;
const HOUR_HEIGHT = 52;
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const localDateKey = (date) => safeDateKey(date.getFullYear(), date.getMonth(), date.getDate());
const dateFromKey = (dateKey) => {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  return new Date(year || 2000, Math.max(0, (month || 1) - 1), day || 1, 12);
};
const addDays = (date, amount) => new Date(date.getTime() + amount * DAY_MS);
const weekStart = (date) => addDays(date, -date.getDay());

const timeMinutes = (value, fallback = START_HOUR * 60) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  return Math.min(24 * 60, Math.max(0, Number(match[1]) * 60 + Number(match[2])));
};

const timeLabel = (minutes) => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}${mins ? `:${String(mins).padStart(2, '0')}` : ''} ${period}`;
};

const entryStart = (entry) => String(entry?.start_time || entry?.time || entry?.time_value || '').slice(0, 5);
const entryEnd = (entry) => String(entry?.end_time || '').slice(0, 5);

function layOutTimedEntries(entries = []) {
  const timed = entries
    .filter((entry) => entryStart(entry))
    .map((entry) => {
      const start = timeMinutes(entryStart(entry));
      const suppliedEnd = timeMinutes(entryEnd(entry), start + 60);
      return { entry, start, end: Math.max(start + 30, suppliedEnd), lane: 0, lanes: 1 };
    })
    .sort((left, right) => left.start - right.start || left.end - right.end);

  const clusters = [];
  timed.forEach((item) => {
    const current = clusters.at(-1);
    if (!current || item.start >= current.end) clusters.push({ end: item.end, items: [item] });
    else {
      current.items.push(item);
      current.end = Math.max(current.end, item.end);
    }
  });

  clusters.forEach((cluster) => {
    const laneEnds = [];
    cluster.items.forEach((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      item.lane = lane;
    });
    cluster.items.forEach((item) => { item.lanes = Math.max(1, laneEnds.length); });
  });

  return timed;
}

export default function RememberMeTimeCalendar({
  viewDate,
  selectedDateKey,
  entriesByDate,
  onMonthChange,
  onSelectDate,
  onEntryClick,
  getEntryLabel,
  getEntryColor,
  getEntryTextColor,
  getEntryClassName,
  monthIdentity,
}) {
  const [mode, setMode] = useState('WEEK');
  const [riddleOpen, setRiddleOpen] = useState(false);
  const scrollerRef = useRef(null);
  const selectedDate = useMemo(() => dateFromKey(selectedDateKey || localDateKey(viewDate)), [selectedDateKey, viewDate]);
  const firstVisibleDate = mode === 'DAY' ? selectedDate : weekStart(selectedDate);
  const visibleDates = useMemo(
    () => Array.from({ length: mode === 'DAY' ? 1 : 7 }, (_, index) => addDays(firstVisibleDate, index)),
    [firstVisibleDate.getTime(), mode],
  );

  useEffect(() => {
    if (mode === 'MONTH' || !scrollerRef.current) return;
    scrollerRef.current.scrollTop = HOUR_HEIGHT * 2;
  }, [mode, selectedDateKey]);

  useEffect(() => setRiddleOpen(false), [monthIdentity?.key]);

  const move = (direction) => {
    if (mode === 'MONTH') {
      const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
      onMonthChange(next, safeDateKey(next.getFullYear(), next.getMonth(), 1));
      return;
    }
    const next = addDays(selectedDate, direction * (mode === 'WEEK' ? 7 : 1));
    onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1), localDateKey(next));
  };

  const selectToday = () => {
    const today = new Date();
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1), localDateKey(today));
  };

  const openSlot = (dateKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const rawMinutes = START_HOUR * 60 + (y / HOUR_HEIGHT) * 60;
    const rounded = Math.round(rawMinutes / 15) * 15;
    const time = `${String(Math.floor(rounded / 60) % 24).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
    onSelectDate(dateKey, dateFromKey(dateKey).getDate(), time);
  };

  const title = mode === 'MONTH'
    ? viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : mode === 'DAY'
      ? selectedDate.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : `${visibleDates[0].toLocaleString('en-US', { month: 'short', day: 'numeric' })} — ${visibleDates[6].toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="remember-scheduler" data-view={mode.toLowerCase()}>
      <header className="remember-scheduler-toolbar">
        <div className="remember-scheduler-nav">
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${mode.toLowerCase()}`}>‹</button>
          <button type="button" className="remember-today-button" onClick={selectToday}>TODAY</button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${mode.toLowerCase()}`}>›</button>
        </div>
        <div className="remember-calendar-title">
          <strong>{title.toUpperCase()}</strong>
          {monthIdentity ? <span>{monthIdentity.title}</span> : null}
        </div>
        <div className="remember-view-switch" aria-label="Calendar view">
          {['WEEK', 'DAY', 'MONTH'].map((option) => (
            <button key={option} type="button" className={mode === option ? 'active' : ''} onClick={() => setMode(option)}>{option}</button>
          ))}
        </div>
      </header>
      <div className="remember-scheduler-legend" aria-label="Calendar color legend">
        <span data-kind="official">OFFICIAL</span>
        <span data-kind="fun">OFFBEAT</span>
        <span data-kind="personal">PERSONAL</span>
        <span data-kind="event">EVENTS</span>
        <span data-kind="standout">WOW · WTF · PLOT TWIST</span>
        <span data-kind="workout">WORKOUT</span>
        <span data-kind="work">WORK</span>
        <span data-kind="popup">POP-UP</span>
      </div>
      {monthIdentity?.riddle ? (
        <div className="remember-month-riddle">
          <strong>SEPTEMBER RIDDLE</strong>
          <span>{monthIdentity.riddle}</span>
          <button type="button" onClick={() => setRiddleOpen((current) => !current)}>{riddleOpen ? 'HIDE ANSWER' : 'REVEAL ANSWER'}</button>
          {riddleOpen ? <b>{monthIdentity.answer}</b> : null}
        </div>
      ) : null}

      {mode === 'MONTH' ? (
        <div className="remember-month-view">
          <ChaoticaMonthCalendar
            viewDate={viewDate}
            selectedDateKey={selectedDateKey}
            entriesByDate={entriesByDate}
            onMonthChange={onMonthChange}
            onSelectDate={onSelectDate}
            onEntryClick={onEntryClick}
            getEntryLabel={getEntryLabel}
            renderEntry={(entry) => <><span className="remember-chip-time">{entryStart(entry) ? timeLabel(timeMinutes(entryStart(entry))) : 'ALL DAY'}</span><span className="remember-chip-label">{getEntryLabel(entry).replace(/^.*?—\s*/, '')}</span></>}
            getEntryColor={getEntryColor}
            getEntryTextColor={getEntryTextColor}
            getEntryClassName={getEntryClassName}
            maxEntriesPerDay={24}
          />
        </div>
      ) : (
        <div className="remember-time-view">
          <div className="remember-time-corner">TIME</div>
          <div className="remember-time-day-heads" style={{ '--remember-visible-days': visibleDates.length }}>
            {visibleDates.map((date) => {
              const dateKey = localDateKey(date);
              const isToday = dateKey === localDateKey(new Date());
              return <button key={dateKey} type="button" className={isToday ? 'is-today' : ''} onClick={() => onSelectDate(dateKey, date.getDate())}><span>{WEEKDAYS[date.getDay()]}</span><b>{date.getDate()}</b></button>;
            })}
          </div>
          <div className="remember-time-scroll" ref={scrollerRef}>
            <div className="remember-time-axis" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
              {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                <span key={index} style={{ top: index * HOUR_HEIGHT }}>{timeLabel((START_HOUR + index) * 60)}</span>
              ))}
            </div>
            <div className="remember-time-days" style={{ '--remember-visible-days': visibleDates.length, height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
              {visibleDates.map((date) => {
                const dateKey = localDateKey(date);
                const entries = entriesByDate?.[dateKey] || [];
                const timedEntries = layOutTimedEntries(entries);
                const allDayEntries = entries.filter((entry) => !entryStart(entry));
                return (
                  <div key={dateKey} className="remember-time-day" onClick={(event) => openSlot(dateKey, event)}>
                    {Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, index) => <i key={index} style={{ top: index * HOUR_HEIGHT / 2 }} />)}
                    {allDayEntries.length ? <div className="remember-all-day-stack">{allDayEntries.map((entry, index) => <button key={entry.id || index} type="button" onClick={(event) => { event.stopPropagation(); onEntryClick(entry, dateKey); }} style={{ '--event-color': getEntryColor(entry) }}>{getEntryLabel(entry)}</button>)}</div> : null}
                    {timedEntries.map(({ entry, start, end, lane, lanes }, index) => {
                      const visibleStart = Math.max(start, START_HOUR * 60);
                      const visibleEnd = Math.min(end, END_HOUR * 60);
                      if (visibleEnd <= visibleStart) return null;
                      const top = ((visibleStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      const height = Math.max(28, ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT - 2);
                      const width = 100 / lanes;
                      return (
                        <button
                          key={entry.id || index}
                          type="button"
                          className="remember-time-event"
                          style={{ top, height, left: `calc(${lane * width}% + 2px)`, width: `calc(${width}% - 4px)`, '--event-color': getEntryColor(entry), '--event-text': getEntryTextColor(entry) }}
                          onClick={(event) => { event.stopPropagation(); onEntryClick(entry, dateKey); }}
                          title={getEntryLabel(entry)}
                        >
                          <span>{timeLabel(start)}{entryEnd(entry) ? `–${timeLabel(end)}` : ''}</span>
                          <strong>{getEntryLabel(entry).replace(/^.*?—\s*/, '')}</strong>
                          {lanes > 1 ? <em>CONFLICT</em> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
