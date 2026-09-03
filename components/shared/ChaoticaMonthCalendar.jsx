'use client';

import { useMemo } from 'react';

export const CHAOTICA_WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export const safeDateKey = (year, month, day) => {
  const dim = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1) return null;
  const safeDay = Math.min(day, dim);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
};

export const getLocalDayFromDateKey = (dateKey) => {
  if (typeof dateKey !== 'string') return null;
  const parts = dateKey.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  return parts[2];
};

export const getSafeMonthDate = (value = new Date()) => {
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(candidate.getFullYear(), candidate.getMonth(), 1);
};

export const buildMonthGrid = (viewDate) => {
  const safeViewDate = getSafeMonthDate(viewDate);
  const y = safeViewDate.getFullYear();
  const m = safeViewDate.getMonth();
  const first = new Date(y, m, 1).getDay();
  const dim = daysInMonth(y, m);
  const previousMonth = new Date(y, m - 1, 1);
  const nextMonth = new Date(y, m + 1, 1);
  const previousMonthDays = daysInMonth(y, m - 1);
  const cells = [];

  for (let i = first - 1; i >= 0; i -= 1) {
    const day = previousMonthDays - i;
    cells.push({
      day,
      inMonth: false,
      dateKey: safeDateKey(previousMonth.getFullYear(), previousMonth.getMonth(), day),
    });
  }

  for (let day = 1; day <= dim; day += 1) {
    cells.push({ day, inMonth: true, dateKey: safeDateKey(y, m, day) });
  }

  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: nextMonthDay,
      inMonth: false,
      dateKey: safeDateKey(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay),
    });
    nextMonthDay += 1;
  }

  return cells;
};

export const getMonthDateKeys = (viewDate) => buildMonthGrid(viewDate).filter((cell) => cell.inMonth).map((cell) => cell.dateKey);

export default function ChaoticaMonthCalendar({
  viewDate,
  selectedDateKey,
  entriesByDate = {},
  onMonthChange,
  onSelectDate,
  getEntryLabel = (entry) => entry?.detail || entry?.title || entry?.type || 'ENTRY',
  getEntryColor = () => '',
  getEntryTextColor = () => '',
  renderEntry,
  onEntryClick,
  maxEntriesPerDay = 3,
  classNames = {},
  previousLabel = '‹',
  nextLabel = '›',
}) {
  const safeViewDate = useMemo(() => getSafeMonthDate(viewDate), [viewDate]);
  const safeEntriesByDate = entriesByDate && typeof entriesByDate === 'object' ? entriesByDate : {};
  const monthGrid = useMemo(() => buildMonthGrid(safeViewDate), [safeViewDate]);

  const shiftMonth = (delta) => {
    const selectedDay = getLocalDayFromDateKey(selectedDateKey) || 1;
    const next = new Date(safeViewDate.getFullYear(), safeViewDate.getMonth() + delta, 1);
    const nextDateKey = safeDateKey(next.getFullYear(), next.getMonth(), Math.min(selectedDay, daysInMonth(next.getFullYear(), next.getMonth())));
    onMonthChange?.(next, nextDateKey);
  };

  return (
    <>
      <div className={classNames.monthRow || 'remember-month-row'}>
        <button type="button" onClick={() => shiftMonth(-1)}>{previousLabel}</button>
        <strong>{safeViewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</strong>
        <button type="button" onClick={() => shiftMonth(1)}>{nextLabel}</button>
      </div>
      <div className={classNames.weekdays || 'remember-weekdays'}>{CHAOTICA_WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className={classNames.grid || 'remember-grid'}>
        {monthGrid.map((cell, index) => {
          const dayEntries = cell.dateKey ? safeEntriesByDate[cell.dateKey] : [];
          const entries = Array.isArray(dayEntries) ? dayEntries : [];
          const visibleEntries = entries.slice(0, maxEntriesPerDay);
          const outsideClass = !cell.inMonth ? (classNames.outsideDay || 'remember-outside') : '';
          const selectedClass = cell.dateKey === selectedDateKey ? (classNames.selectedDay || 'remember-selected') : '';
          return (
            <button
              key={`${cell.dateKey || index}-${cell.day}`}
              type="button"
              className={[classNames.day || 'remember-day', outsideClass, selectedClass].filter(Boolean).join(' ')}
              onClick={() => { if (cell.inMonth && cell.dateKey) onSelectDate?.(cell.dateKey, cell.day); }}
              disabled={!cell.inMonth}
            >
              <span className={classNames.dayNumber || 'remember-day-num'}>{cell.day}</span>
              <span className={classNames.entryStack || 'remember-day-chips'}>
                {visibleEntries.map((entry, entryIndex) => (
                  <span
                    key={entry.id || `${cell.dateKey}-entry-${index}-${entryIndex}`}
                    className={classNames.entryChip || 'remember-chip remember-chip-entry'}
                    style={{ '--remember-entry-color': getEntryColor(entry), '--remember-entry-text': getEntryTextColor(entry) }}
                    aria-label={getEntryLabel(entry)}
                    title={getEntryLabel(entry)}
                    onClick={(event) => {
                      if (!onEntryClick) return;
                      event.stopPropagation();
                      onEntryClick(entry, cell.dateKey);
                    }}
                  >
                    {renderEntry ? renderEntry(entry) : getEntryLabel(entry)}
                  </span>
                ))}
                {entries.length > maxEntriesPerDay ? <span className={classNames.moreChip || 'remember-chip'}>+{entries.length - maxEntriesPerDay} MORE</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
