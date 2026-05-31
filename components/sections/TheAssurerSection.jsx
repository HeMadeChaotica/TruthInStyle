'use client';

import { useMemo, useState } from 'react';
import { DROPDOWN_KEYS, useDropdownOptions } from '../../lib/dropdowns/dropdownOptions';
import '../../styles/sections/the-assurer.css';

const STATIC_REVIEW_WIDGETS = [
  { number: '02', className: 'assurer-macro-bars', label: 'MACRO BARS', sample: 'REVIEW SHELL PENDING' },
  { number: '03', className: 'assurer-battle-cry-tile', label: 'BATTLE CRY', sample: 'REVIEW SHELL PENDING' },
  { number: '05', className: 'assurer-meal-log', label: 'MEAL LOG', sample: 'REVIEW SHELL PENDING' },
  { number: '06', className: 'assurer-body-sleep-water', label: 'BODY / SLEEP / WATER', sample: 'REVIEW SHELL PENDING' },
  { number: '09', className: 'assurer-media-strip', label: 'MEDIA STRIP', sample: 'REVIEW SHELL PENDING' },
  { number: '10', className: 'assurer-week-strip', label: 'WEEK STRIP', sample: 'REVIEW SHELL PENDING' },
  { number: '11', className: 'assurer-metric-strip', label: 'METRICS', sample: 'REVIEW SHELL PENDING' },
  { number: '12', className: 'assurer-day-timeline', label: 'DAY TIMELINE', sample: 'REVIEW SHELL PENDING' },
  { number: '13', className: 'assurer-moment-flip-cards', label: 'MOMENT FLIP CARDS', sample: 'REVIEW SHELL PENDING' },
];

function formatAssurerDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function AssurerField({ id, label, children }) {
  return (
    <label className="assurer-field" htmlFor={id}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function AssurerSelect({ id, value, onChange, options }) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <select
      id={id}
      className="assurer-control assurer-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={!safeOptions.length}
    >
      <option value="" aria-label="NO SELECTION"></option>
      {safeOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function TheAssurerSection() {
  const moodOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentMood);
  const eraOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentEra);
  const singlenessOptions = useDropdownOptions(DROPDOWN_KEYS.assessmentSingleness);
  const lobitoOptions = useDropdownOptions(DROPDOWN_KEYS.lobitoCheckIn);

  const [titleOfDay, setTitleOfDay] = useState('DISCIPLINE IS ROYALTY');
  const [mood, setMood] = useState('');
  const [era, setEra] = useState('');
  const [singlenessLevel, setSinglenessLevel] = useState('');
  const [lobitoCheckIn, setLobitoCheckIn] = useState('');
  const [location, setLocation] = useState('');
  const [headHummer, setHeadHummer] = useState('');
  const [wordOfDay, setWordOfDay] = useState('VELVET RUCKUS');
  const [wordDefinition, setWordDefinition] = useState('A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.');
  const [assuredThoughts, setAssuredThoughts] = useState('');

  // TODO: Persist assurer_assessment and assured_thoughts through the project storage layer when the Assurer daily store is finalized.
  const date = useMemo(() => formatAssurerDate(new Date()), []);
  const weatherSummary = location ? `${location} WEATHER PENDING` : 'LOCATION WEATHER PENDING';
  const assurerNativePayload = useMemo(() => ({
    titleOfDay,
    date,
    mood,
    era,
    singlenessLevel,
    lobitoCheckIn,
    location,
    weatherSummary,
    headHummer,
    wordOfDay,
    wordDefinition,
    assuredThoughts,
  }), [
    titleOfDay,
    date,
    mood,
    era,
    singlenessLevel,
    lobitoCheckIn,
    location,
    weatherSummary,
    headHummer,
    wordOfDay,
    wordDefinition,
    assuredThoughts,
  ]);
  void assurerNativePayload;

  return (
    <section className="assurer-oracle-shell" aria-label="THE.ASSURER oracle board">
      <div className="assurer-oracle-stage">
        <img
          className="assurer-scene"
          src="/backgrounds/THE-ASSURER/the-assurer-bg-v2.PNG"
          alt=""
          aria-hidden="true"
        />
        <div className="assurer-widget-layer">
          <article className="assurer-widget assurer-title-cluster">
            <div className="assurer-widget-content assurer-title-content">
              <span className="assurer-widget-number">01</span>
              <div className="assurer-title-fields">
                <time dateTime={date}>{date}</time>
                <AssurerField id="assurer-title-of-day" label="TITLE OF THE DAY">
                  <input
                    id="assurer-title-of-day"
                    className="assurer-control assurer-title-input"
                    value={titleOfDay}
                    onChange={(event) => setTitleOfDay(event.target.value)}
                  />
                </AssurerField>
              </div>
            </div>
          </article>

          {STATIC_REVIEW_WIDGETS.map((widget) => (
            <article key={widget.number} className={`assurer-widget ${widget.className}`}>
              <div className="assurer-widget-content">
                <span className="assurer-widget-number">{widget.number}</span>
                <strong>{widget.label}</strong>
                <small>{widget.sample}</small>
              </div>
            </article>
          ))}

          <article className="assurer-widget assurer-weather-tile">
            <div className="assurer-widget-content assurer-weather-content">
              <span className="assurer-widget-number">04</span>
              <strong>LOCATION / WEATHER</strong>
              <div className="assurer-weather-icon" aria-hidden="true">☁</div>
              <small>{weatherSummary}</small>
              <small>TEMP PENDING</small>
              <small>CONDITION PENDING</small>
            </div>
          </article>

          <article className="assurer-widget assurer-word-panel">
            <div className="assurer-widget-content assurer-word-content">
              <span className="assurer-widget-number">07</span>
              <strong>WORD OF THE DAY</strong>
              <AssurerField id="assurer-word-of-day" label="WORD:">
                <input
                  id="assurer-word-of-day"
                  className="assurer-control"
                  value={wordOfDay}
                  onChange={(event) => setWordOfDay(event.target.value)}
                />
              </AssurerField>
              <AssurerField id="assurer-word-definition" label="DEFINITION:">
                <textarea
                  id="assurer-word-definition"
                  className="assurer-control assurer-definition-input"
                  value={wordDefinition}
                  onChange={(event) => setWordDefinition(event.target.value)}
                />
              </AssurerField>
            </div>
          </article>

          <article className="assurer-widget assurer-daily-orbit">
            <div className="assurer-widget-content assurer-daily-content">
              <span className="assurer-widget-number">08</span>
              <AssurerField id="assurer-mood" label="MOOD">
                <AssurerSelect id="assurer-mood" value={mood} onChange={setMood} options={moodOptions} />
              </AssurerField>
              <AssurerField id="assurer-era" label="ERA">
                <AssurerSelect id="assurer-era" value={era} onChange={setEra} options={eraOptions} />
              </AssurerField>
              <AssurerField id="assurer-singleness" label="SINGLENESS LEVEL">
                <AssurerSelect id="assurer-singleness" value={singlenessLevel} onChange={setSinglenessLevel} options={singlenessOptions} />
              </AssurerField>
              <AssurerField id="assurer-lobito" label="LOBITO CHECK-IN">
                <AssurerSelect id="assurer-lobito" value={lobitoCheckIn} onChange={setLobitoCheckIn} options={lobitoOptions} />
              </AssurerField>
              <AssurerField id="assurer-head-hummer" label="HEAD HUMMER">
                <input
                  id="assurer-head-hummer"
                  className="assurer-control"
                  value={headHummer}
                  onChange={(event) => setHeadHummer(event.target.value)}
                  placeholder="SONG / LOOP"
                />
              </AssurerField>
              <AssurerField id="assurer-location" label="LOCATION">
                <input
                  id="assurer-location"
                  className="assurer-control"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="LOCATION"
                />
              </AssurerField>
            </div>
          </article>

          <article className="assurer-widget assurer-assured-thoughts">
            <div className="assurer-widget-content assurer-thoughts-content">
              <span className="assurer-widget-number">14</span>
              <strong>ASSURED THOUGHTS</strong>
              <textarea
                className="assurer-control assurer-lined-writing"
                value={assuredThoughts}
                onChange={(event) => setAssuredThoughts(event.target.value)}
                aria-label="ASSURED THOUGHTS"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
