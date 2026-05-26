'use client';

import { useMemo, useState } from 'react';

const TODAY = new Date();
const pad = (n) => String(n).padStart(2, '0');
const todayDisplay = `${pad(TODAY.getMonth() + 1)}/${pad(TODAY.getDate())}/${TODAY.getFullYear()}`;

const MOOD_OPTIONS = ['CALM', 'FOCUSED', 'BOLD', 'GRATEFUL', 'FIERY'];
const ERA_OPTIONS = ['RESET ERA', 'GLOW-UP ERA', 'DISCIPLINE ERA', 'MAIN CHARACTER ERA'];
const SINGLENESS_OPTIONS = ['UNBOTHERED', 'OPEN', 'SELECTIVE', 'DEVOTED TO SELF'];

const toCaps = (value) => value.toUpperCase();
const normalizeDateInput = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function AssurerSection() {
  const [titleOfDay, setTitleOfDay] = useState('');
  const [dayDate, setDayDate] = useState(todayDisplay);
  const [mood, setMood] = useState(MOOD_OPTIONS[0]);
  const [era, setEra] = useState(ERA_OPTIONS[0]);
  const [singlenessLevel, setSinglenessLevel] = useState(SINGLENESS_OPTIONS[0]);
  const [location, setLocation] = useState('');
  const [headHummer, setHeadHummer] = useState('');
  const [wordOfDay, setWordOfDay] = useState('');
  const [assuredThoughts, setAssuredThoughts] = useState('');

  const headerDate = useMemo(() => normalizeDateInput(dayDate) || todayDisplay, [dayDate]);

  return (
    <section className="assurer-section" aria-label="THE ASSURER">
      <div className="assurer-card">
        <h2>THE.ASSURER</h2>
        <p className="assurer-date">{headerDate}</p>

        <label htmlFor="title-of-day">TITLE OF THE DAY</label>
        <input id="title-of-day" value={titleOfDay} onChange={(e) => setTitleOfDay(toCaps(e.target.value))} placeholder="TYPE TITLE" maxLength={80} />

        <label htmlFor="day-date">DATE (MM/DD/YYYY)</label>
        <input
          id="day-date"
          value={dayDate}
          onChange={(e) => setDayDate(normalizeDateInput(e.target.value))}
          placeholder="MM/DD/YYYY"
          inputMode="numeric"
          maxLength={10}
        />

        <div className="assurer-grid">
          <div>
            <label htmlFor="mood">MOOD</label>
            <select id="mood" value={mood} onChange={(e) => setMood(toCaps(e.target.value))}>{MOOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          </div>
          <div>
            <label htmlFor="era">ERA</label>
            <select id="era" value={era} onChange={(e) => setEra(toCaps(e.target.value))}>{ERA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          </div>
          <div>
            <label htmlFor="single">SINGLENESS LEVEL</label>
            <select id="single" value={singlenessLevel} onChange={(e) => setSinglenessLevel(toCaps(e.target.value))}>{SINGLENESS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          </div>
        </div>

        <label htmlFor="location">LOCATION</label>
        <input id="location" value={location} onChange={(e) => setLocation(toCaps(e.target.value))} placeholder="TYPE LOCATION" maxLength={120} />

        <label htmlFor="head-hummer">HEAD HUMMER</label>
        <input id="head-hummer" value={headHummer} onChange={(e) => setHeadHummer(toCaps(e.target.value))} placeholder="WHAT'S LOOPING?" maxLength={120} />

        <label htmlFor="word-day">WORD OF THE DAY</label>
        <input id="word-day" value={wordOfDay} onChange={(e) => setWordOfDay(toCaps(e.target.value))} placeholder="ONE WORD" maxLength={40} />

        <label htmlFor="assured-thoughts">ASSURED THOUGHTS</label>
        <textarea id="assured-thoughts" value={assuredThoughts} onChange={(e) => setAssuredThoughts(toCaps(e.target.value))} placeholder="DROP YOUR ASSURED THOUGHTS" rows={6} />
      </div>
    </section>
  );
}
