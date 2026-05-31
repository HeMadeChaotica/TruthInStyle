'use client';

import { useEffect, useMemo, useState } from 'react';
import { DROPDOWN_KEYS, useDropdownOptions } from '../../lib/dropdowns/dropdownOptions';
import '../../styles/sections/the-assurer.css';

const STATIC_REVIEW_WIDGETS = [
  { number: '02', className: 'assurer-macro-bars', label: 'MACRO BARS' },
  { number: '03', className: 'assurer-battle-cry-tile', label: 'BATTLE CRY' },
  { number: '05', className: 'assurer-meal-log', label: 'MEAL LOG' },
  { number: '06', className: 'assurer-body-sleep-water', label: 'BODY / SLEEP / WATER' },
  { number: '09', className: 'assurer-media-strip', label: 'MEDIA STRIP' },
  { number: '10', className: 'assurer-week-strip', label: 'WEEK STRIP' },
  { number: '11', className: 'assurer-metric-strip', label: 'METRICS' },
  { number: '12', className: 'assurer-day-timeline', label: 'DAY TIMELINE' },
  { number: '13', className: 'assurer-moment-flip-cards', label: 'MOMENT FLIP CARDS' },
];

const WEATHER_CITY_OPTIONS = [
  'HOUSTON, TX',
  'LOS ANGELES, CA',
  'DALLAS, TX',
  'AUSTIN, TX',
  'SAN ANTONIO, TX',
  'NEW ORLEANS, LA',
  'ATLANTA, GA',
  'MIAMI, FL',
  'NEW YORK, NY',
  'CHICAGO, IL',
];

const DAILY_WORD_BANK = [
  {
    word: 'VELVET RUCKUS',
    definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.',
  },
  {
    word: 'HONEY STATIC',
    definition: 'SWEET ENERGY THAT STILL CRACKLES LOUD ENOUGH TO CHANGE THE ROOM.',
  },
  {
    word: 'THUNDER POLITE',
    definition: 'A CALM LITTLE WARNING WITH A STORM HIDING BEHIND ITS MANNERS.',
  },
  {
    word: 'GLAMOUR TAX',
    definition: 'THE EXTRA PRICE PAID FOR LOOKING TOO GOOD TO BE IGNORED.',
  },
  {
    word: 'SOFT THREAT',
    definition: 'GENTLE PRESENCE WITH ENOUGH POWER TO MAKE NONSENSE STEP BACK.',
  },
  {
    word: 'CHROME YEARNING',
    definition: 'SHINY FUTURE HUNGER THAT REFUSES TO PRETEND IT IS SMALL.',
  },
  {
    word: 'DELULU WEATHER',
    definition: 'A FORECAST WHERE CONFIDENCE ARRIVES BEFORE THE EVIDENCE DOES.',
  },
  {
    word: 'SAINTED NONSENSE',
    definition: 'CHAOS SO COMMITTED TO ITS OWN CEREMONY THAT IT BECOMES HOLY.',
  },
  {
    word: 'FERAL GRACE',
    definition: 'WILD MOVEMENT THAT SOMEHOW LANDS WITH PERFECT ELEGANCE.',
  },
  {
    word: 'BOUJEE DETONATION',
    definition: 'AN EXPLOSION OF TASTE, DRAMA, AND UNAPOLOGETIC EXPENSE.',
  },
];

const ASSURER_TITLE_STORAGE_KEY = 'the_assurer_title_of_day';
const ASSURER_WORD_STORAGE_KEY = 'the_assurer_word_of_day';

function formatAssurerDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatAssurerStorageDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function getDailyWordDefault(storageDate) {
  const seed = storageDate.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return DAILY_WORD_BANK[seed % DAILY_WORD_BANK.length];
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

  const today = useMemo(() => new Date(), []);
  const date = useMemo(() => formatAssurerDate(today), [today]);
  const storageDate = useMemo(() => formatAssurerStorageDate(today), [today]);
  const defaultDailyWord = useMemo(() => getDailyWordDefault(storageDate), [storageDate]);

  const [titleOfDay, setTitleOfDay] = useState('');
  const [mood, setMood] = useState('');
  const [era, setEra] = useState('');
  const [singlenessLevel, setSinglenessLevel] = useState('');
  const [lobitoCheckIn, setLobitoCheckIn] = useState('');
  const [location, setLocation] = useState('');
  const [headHummer, setHeadHummer] = useState('');
  const [weatherCity, setWeatherCity] = useState(WEATHER_CITY_OPTIONS[0]);
  const [gpsSupported, setGpsSupported] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [wordOfDay, setWordOfDay] = useState(defaultDailyWord.word);
  const [wordDefinition, setWordDefinition] = useState(defaultDailyWord.definition);
  const [assuredThoughts, setAssuredThoughts] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedTitle = window.localStorage.getItem(`${ASSURER_TITLE_STORAGE_KEY}:${storageDate}`);
      if (savedTitle !== null) {
        setTitleOfDay(savedTitle);
      }

      const savedWord = window.localStorage.getItem(`${ASSURER_WORD_STORAGE_KEY}:${storageDate}`);
      if (savedWord) {
        const parsedWord = JSON.parse(savedWord);
        if (typeof parsedWord?.word === 'string') {
          setWordOfDay(parsedWord.word);
        }
        if (typeof parsedWord?.definition === 'string') {
          setWordDefinition(parsedWord.definition);
        }
      }
    } catch {
      // Keep the blank title and deterministic daily word when local storage is unavailable.
    } finally {
      setStorageLoaded(true);
    }
  }, [storageDate]);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(`${ASSURER_TITLE_STORAGE_KEY}:${storageDate}`, titleOfDay);
    } catch {
      // Local storage is optional for this native panel.
    }
  }, [storageDate, storageLoaded, titleOfDay]);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(`${ASSURER_WORD_STORAGE_KEY}:${storageDate}`, JSON.stringify({
        word: wordOfDay,
        definition: wordDefinition,
      }));
    } catch {
      // Local storage is optional for this native panel.
    }
  }, [storageDate, storageLoaded, wordDefinition, wordOfDay]);

  useEffect(() => {
    setGpsSupported(typeof window !== 'undefined' && 'geolocation' in window.navigator);
  }, []);

  const useGpsWeatherLocation = () => {
    if (!gpsSupported) {
      return;
    }

    setGpsStatus('GPS REQUESTING');
    window.navigator.geolocation.getCurrentPosition(
      () => {
        setGpsStatus('GPS LOCKED — WEATHER PENDING');
      },
      () => {
        setGpsStatus('GPS DENIED — WEATHER PENDING');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  // TODO: Persist assurer_assessment and assured_thoughts through the project storage layer when the Assurer daily store is finalized.
  const weatherSummary = `${weatherCity} WEATHER PENDING`;
  const assurerNativePayload = useMemo(() => ({
    titleOfDay,
    date,
    mood,
    era,
    singlenessLevel,
    lobitoCheckIn,
    location,
    weatherCity,
    weatherSummary,
    gpsStatus,
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
    weatherCity,
    weatherSummary,
    gpsStatus,
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
          <article className="assurer-widget assurer-title-cluster" data-slot="01">
            <div className="assurer-widget-content assurer-title-content">
              <div className="assurer-title-fields">
                <time dateTime={date}>{date}</time>
                <input
                  id="assurer-title-of-day"
                  className="assurer-control assurer-title-input"
                  value={titleOfDay}
                  onChange={(event) => setTitleOfDay(event.target.value)}
                  aria-label="TITLE OF THE DAY"
                />
              </div>
            </div>
          </article>

          {STATIC_REVIEW_WIDGETS.map((widget) => (
            <article key={widget.number} className={`assurer-widget ${widget.className}`} data-slot={widget.number}>
              <div className="assurer-widget-content assurer-placeholder-content">
                <strong>{widget.label}</strong>
              </div>
            </article>
          ))}

          <article className="assurer-widget assurer-weather-tile" data-slot="04">
            <div className="assurer-widget-content assurer-weather-content">
              <strong>WEATHER</strong>
              <select
                id="assurer-weather-city"
                className="assurer-control assurer-select assurer-weather-select"
                value={weatherCity}
                onChange={(event) => {
                  setWeatherCity(event.target.value);
                  setGpsStatus('');
                }}
                aria-label="WEATHER CITY"
              >
                {WEATHER_CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {gpsSupported ? (
                <button className="assurer-gps-button" type="button" onClick={useGpsWeatherLocation}>
                  USE GPS
                </button>
              ) : null}
              <div className="assurer-weather-display" aria-live="polite">
                <small>{weatherSummary}</small>
                <small>{gpsStatus || 'WEATHER PENDING'}</small>
              </div>
            </div>
          </article>

          <article className="assurer-widget assurer-word-panel" data-slot="07">
            <div className="assurer-widget-content assurer-word-content">
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

          <article className="assurer-widget assurer-daily-orbit" data-slot="08">
            <div className="assurer-widget-content assurer-daily-content">
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

          <article className="assurer-widget assurer-assured-thoughts" data-slot="14">
            <div className="assurer-widget-content assurer-thoughts-content">
              <strong>ASSURED THOUGHTS</strong>
              <textarea
                className="assurer-control assurer-lined-writing assurer-thoughts-textarea"
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
