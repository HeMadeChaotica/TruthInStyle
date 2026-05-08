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

const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) cells.push({ day: daysInPrevMonth - i, inMonth: false });
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ day, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length % 7 + 1, inMonth: false });

  return cells;
}

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  const monthIndex = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const monthBackground = MONTH_BACKGROUND_BY_INDEX[monthIndex];
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const bgStyle = {
    '--remember-bg-image': `url('/backgrounds/REMEMBER-ME/${monthBackground}')`
  };

  const stepMonth = (dir) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + dir, 1));
    setSelectedDay(1);
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
              <h2>{monthName} {year}</h2>
              <button type="button" onClick={() => stepMonth(1)} aria-label="Next month">›</button>
            </div>
            <div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="remember-grid">
              {monthGrid.map((cell, idx) => (
                <button
                  key={`${idx}-${cell.day}`}
                  type="button"
                  className={`remember-day ${cell.inMonth ? '' : 'remember-outside'} ${cell.inMonth && selectedDay === cell.day ? 'remember-selected' : ''}`.trim()}
                  onClick={() => cell.inMonth && setSelectedDay(cell.day)}
                  disabled={!cell.inMonth}
                >
                  {cell.day}
                </button>
              ))}
            </div>
          </section>

          <aside className="remember-rail" aria-label="Right glyph rail">
            <button type="button">WOW</button>
            <button type="button">PLOT TWIST</button>
            <button type="button">WTF</button>
            <button type="button">STAMP IT</button>
          </aside>
        </main>
      </div>
    </section>
  );
}
