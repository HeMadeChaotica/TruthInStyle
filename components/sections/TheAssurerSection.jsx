'use client';

import { useEffect, useMemo, useState } from 'react';
import { DROPDOWN_KEYS, useDropdownOptions } from '../../lib/dropdowns/dropdownOptions';
import { getBattleCryForDate } from '../../lib/theAssurer/battleCryQuotes';
import {
  DEFAULT_WEATHER_CITY,
  WEATHER_CITY_COORDINATES,
  WEATHER_CITY_OPTIONS,
  fetchAssurerWeather,
} from '../../lib/theAssurer/weatherOptions';
import '../../styles/sections/the-assurer.css';

const STATIC_REVIEW_WIDGETS = [
  { number: '02', className: 'assurer-macro-bars', label: 'MACRO BARS' },
  { number: '05', className: 'assurer-meal-log', label: 'MEAL LOG' },
  { number: '06', className: 'assurer-body-sleep-water', label: 'BODY / SLEEP / WATER' },
  { number: '09', className: 'assurer-media-strip', label: 'MEDIA STRIP' },
  { number: '10', className: 'assurer-week-strip', label: 'WEEK STRIP' },
  { number: '11', className: 'assurer-metric-strip', label: 'METRICS' },
  { number: '12', className: 'assurer-day-timeline', label: 'DAY TIMELINE' },
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
  const dailyBattleCry = useMemo(() => getBattleCryForDate(today), [today]);

  const [titleOfDay, setTitleOfDay] = useState('');
  const [mood, setMood] = useState('');
  const [era, setEra] = useState('');
  const [singlenessLevel, setSinglenessLevel] = useState('');
  const [lobitoCheckIn, setLobitoCheckIn] = useState('');
  const [location, setLocation] = useState('');
  const [headHummer, setHeadHummer] = useState('');
  const [weatherCity, setWeatherCity] = useState(DEFAULT_WEATHER_CITY);
  const [weatherDisplayLabel, setWeatherDisplayLabel] = useState(DEFAULT_WEATHER_CITY);
  const [weatherResult, setWeatherResult] = useState(null);
  const [expandedWidget, setExpandedWidget] = useState(null);
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

  const loadWeather = async ({ displayLabel, coordinates }) => {
    setWeatherDisplayLabel(displayLabel);
    setWeatherResult(null);

    try {
      const nextWeatherResult = await fetchAssurerWeather(coordinates);
      setWeatherResult(nextWeatherResult);
    } catch {
      setWeatherResult(null);
    }
  };

  useEffect(() => {
    void loadWeather({
      displayLabel: DEFAULT_WEATHER_CITY,
      coordinates: WEATHER_CITY_COORDINATES[DEFAULT_WEATHER_CITY],
    });
  }, []);


  useEffect(() => {
    if (!expandedWidget) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setExpandedWidget(null);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [expandedWidget]);

  const momentCards = [
    { type: 'WOW', date: 'DATE TBD', text: 'NO MOMENT RECORDED YET' },
    { type: 'WTF', date: 'DATE TBD', text: 'NO MOMENT RECORDED YET' },
    { type: 'PLOT TWIST', date: 'DATE TBD', text: 'NO MOMENT RECORDED YET' },
  ];

  const openExpandedWidget = (widgetName) => setExpandedWidget(widgetName);
  const closeExpandedWidget = () => setExpandedWidget(null);

  const weatherCitySelect = (id, className = '') => (
    <select
      id={id}
      className={`assurer-control assurer-select assurer-weather-select ${className}`.trim()}
      value={weatherCity}
      onChange={(event) => {
        const nextCity = event.target.value;
        setWeatherCity(nextCity);
        void loadWeather({
          displayLabel: nextCity,
          coordinates: WEATHER_CITY_COORDINATES[nextCity],
        });
      }}
      aria-label="WEATHER CITY"
    >
      {WEATHER_CITY_OPTIONS.map((city) => (
        <option key={city} value={city}>{city}</option>
      ))}
    </select>
  );

  const expandedTitles = {
    battleCry: 'BATTLE CRY',
    weather: 'WEATHER',
    word: 'WORD OF THE DAY',
    thoughts: 'ASSURED THOUGHTS',
    dailyOrbit: 'DAILY ORBIT',
    moments: 'MOMENT FLIP CARDS',
  };

  const renderExpandedBody = () => {
    switch (expandedWidget) {
      case 'battleCry':
        return (
          <div className="assurer-expanded-battle-cry">
            <p className="assurer-expanded-quote">{dailyBattleCry.text}</p>
            <p className="assurer-expanded-attribution">{dailyBattleCry.attribution}</p>
            {dailyBattleCry.category ? <p className="assurer-expanded-meta">CATEGORY: {dailyBattleCry.category}</p> : null}
          </div>
        );
      case 'weather':
        return (
          <div className="assurer-expanded-weather">
            <AssurerField id="assurer-weather-city-expanded" label="CITY">
              {weatherCitySelect('assurer-weather-city-expanded', 'assurer-weather-select-expanded')}
            </AssurerField>
            <div className="assurer-expanded-weather-grid" aria-live="polite">
              <span>CITY</span><strong>{weatherDisplayLabel}</strong>
              {weatherResult ? (
                <>
                  <span>TEMP</span><strong>{weatherResult.temperature}°</strong>
                  <span>FEELS LIKE</span><strong>{weatherResult.feelsLike}°</strong>
                  <span>HUMIDITY</span><strong>{weatherResult.humidity}%</strong>
                  <span>WIND</span><strong>{weatherResult.wind} MPH</strong>
                  <span>CONDITION</span><strong>{weatherResult.condition}</strong>
                </>
              ) : (
                <><span>STATUS</span><strong>WEATHER PENDING</strong></>
              )}
            </div>
          </div>
        );
      case 'word':
        return (
          <div className="assurer-expanded-word">
            <input
              className="assurer-control assurer-expanded-word-input"
              value={wordOfDay}
              onChange={(event) => setWordOfDay(event.target.value)}
              aria-label="WORD OF THE DAY"
            />
            <textarea
              className="assurer-control assurer-expanded-definition-input"
              value={wordDefinition}
              onChange={(event) => setWordDefinition(event.target.value)}
              aria-label="WORD OF THE DAY DEFINITION"
            />
          </div>
        );
      case 'thoughts':
        return (
          <textarea
            className="assurer-control assurer-lined-writing assurer-expanded-thoughts-textarea"
            value={assuredThoughts}
            onChange={(event) => setAssuredThoughts(event.target.value)}
            aria-label="ASSURED THOUGHTS EXPANDED"
          />
        );
      case 'dailyOrbit':
        return (
          <div className="assurer-expanded-daily-grid">
            <AssurerField id="assurer-mood-expanded" label="MOOD">
              <AssurerSelect id="assurer-mood-expanded" value={mood} onChange={setMood} options={moodOptions} />
            </AssurerField>
            <AssurerField id="assurer-era-expanded" label="ERA">
              <AssurerSelect id="assurer-era-expanded" value={era} onChange={setEra} options={eraOptions} />
            </AssurerField>
            <AssurerField id="assurer-singleness-expanded" label="SINGLENESS LEVEL">
              <AssurerSelect id="assurer-singleness-expanded" value={singlenessLevel} onChange={setSinglenessLevel} options={singlenessOptions} />
            </AssurerField>
            <AssurerField id="assurer-lobito-expanded" label="LOBITO CHECK-IN">
              <AssurerSelect id="assurer-lobito-expanded" value={lobitoCheckIn} onChange={setLobitoCheckIn} options={lobitoOptions} />
            </AssurerField>
            <AssurerField id="assurer-head-hummer-expanded" label="HEAD HUMMER">
              <input id="assurer-head-hummer-expanded" className="assurer-control" value={headHummer} onChange={(event) => setHeadHummer(event.target.value)} placeholder="SONG / LOOP" />
            </AssurerField>
            <AssurerField id="assurer-location-expanded" label="LOCATION">
              <input id="assurer-location-expanded" className="assurer-control" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="LOCATION" />
            </AssurerField>
          </div>
        );
      case 'moments':
        return (
          <div className="assurer-expanded-moment-grid">
            {momentCards.map((card) => (
              <article key={card.type} className="assurer-moment-card">
                <div className="assurer-moment-media">READY FOR REMEMBER.ME</div>
                <strong>{card.type}</strong>
                <small>{card.date}</small>
                <p>{card.text}</p>
                <span>READY FOR REMEMBER.ME</span>
              </article>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // TODO: Persist assurer_assessment and assured_thoughts through the project storage layer when the Assurer daily store is finalized.
  const weatherSummary = weatherResult
    ? `${weatherDisplayLabel} ${weatherResult.condition}`
    : `${weatherDisplayLabel} WEATHER PENDING`;
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

          <article className="assurer-widget assurer-battle-cry-tile" data-slot="03">
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('battleCry')}
              aria-label="EXPAND BATTLE CRY"
            >
              ⤢
            </button>
            <div className="assurer-widget-content assurer-battle-cry-content">
              <strong>BATTLE CRY</strong>
              <p className="assurer-battle-cry-quote">{dailyBattleCry.text}</p>
              <small className="assurer-battle-cry-attribution">{dailyBattleCry.attribution}</small>
            </div>
          </article>

          <article className="assurer-widget assurer-weather-tile" data-slot="04">
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('weather')}
              aria-label="EXPAND WEATHER"
            >
              ⤢
            </button>
            <div className="assurer-widget-content assurer-weather-content">
              <strong>WEATHER</strong>
              {weatherCitySelect('assurer-weather-city')}
              <div className="assurer-weather-display" aria-live="polite">
                <small>{weatherDisplayLabel}</small>
                {weatherResult ? (
                  <>
                    <small>TEMP: {weatherResult.temperature}°</small>
                    <small>FEELS: {weatherResult.feelsLike}°</small>
                    <small>CONDITION: {weatherResult.condition}</small>
                  </>
                ) : (
                  <small>WEATHER PENDING</small>
                )}
              </div>
            </div>
          </article>

          <article className="assurer-widget assurer-word-panel" data-slot="07">
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('word')}
              aria-label="EXPAND WORD OF THE DAY"
            >
              ⤢
            </button>
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
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('dailyOrbit')}
              aria-label="EXPAND DAILY ORBIT"
            >
              ⤢
            </button>
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

          <article className="assurer-widget assurer-moment-flip-cards" data-slot="13">
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('moments')}
              aria-label="EXPAND MOMENT FLIP CARDS"
            >
              ⤢
            </button>
            <div className="assurer-widget-content assurer-moment-content">
              <strong>MOMENT FLIP CARDS</strong>
              <div className="assurer-moment-preview-grid">
                {momentCards.map((card) => (
                  <div key={card.type} className="assurer-moment-preview-slot">
                    <span>{card.type}</span>
                    <small>NO MOMENT RECORDED YET</small>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="assurer-widget assurer-assured-thoughts" data-slot="14">
            <button
              className="assurer-expand-button"
              type="button"
              onClick={() => openExpandedWidget('thoughts')}
              aria-label="EXPAND ASSURED THOUGHTS"
            >
              ⤢
            </button>
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
        {expandedWidget ? (
          <div className="assurer-expanded-backdrop" role="presentation" onClick={closeExpandedWidget}>
            <section
              className="assurer-expanded-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="assurer-expanded-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="assurer-expanded-header">
                <h2 id="assurer-expanded-title" className="assurer-expanded-title">
                  {expandedTitles[expandedWidget]}
                </h2>
                <button className="assurer-expanded-close" type="button" onClick={closeExpandedWidget}>
                  CLOSE
                </button>
              </header>
              <div className="assurer-expanded-body">{renderExpandedBody()}</div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
}
