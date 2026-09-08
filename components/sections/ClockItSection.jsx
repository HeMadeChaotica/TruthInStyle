'use client';

import { useMemo, useState } from 'react';
import '../../styles/sections/clock-it.css';
import {
  CLOCK_IT_REGISTRY,
  getClockItDefinition,
  resetClockItDefinition,
  saveClockItDefinition,
} from '../../lib/dropdowns/clockItRegistry';

const sections = [...new Set(Object.values(CLOCK_IT_REGISTRY).map((entry) => entry.section))];
const LEGEND_SYSTEMS = [
  ['THE.ASSURER', 'DAILY TRUTH, MOOD, WORD, WEATHER, AND DAY TITLE'],
  ['DA.EATER', 'MEALS, MACROS, SUPPLEMENTS, CRAVINGS, TREATS, AND DA.REUP'],
  ['THICC.FITT', 'TRAINING, BODY RECEIPTS, SLEEP, VAULT, AND WORKOUT MUSIC'],
  ['REMEMBER.ME', 'LIFE CALENDAR, WORK, POP-UPS, WORKOUTS, AND STANDOUT MOMENTS'],
  ['THE.SUMMATION', 'AUTHENTICATED DAY RENDER AND FINAL JUDGMENT'],
  ['HOPEWOOD', 'SEARCHABLE ARCHIVE OF SEALED DAYS'],
  ['525600', 'LONG-RANGE PATTERNS AND THE YEAR’S VERDICT'],
  ['CLOCK.IT', 'THE CONTROL REGISTRY FOR EDITABLE APP OPTIONS'],
];
const LEGEND_UTILITIES = [
  ['EYE OF TRUTH', 'CHOOSE THE ACTIVE DAY WITHOUT CHANGING SAVED HISTORY'],
  ['CRYSTAL WAND', 'SEND THE ACTIVE DAY TO THE AUTHENTICATED SUMMATION RENDERER'],
  ['SO LET IT BE DONE', 'SEAL THE COMPLETED DAY INTO HOPEWOOD'],
  ['LIFE STAFF', 'OPEN THE NATIVE APP AND SIGNAL DAILY INPUT TIMES'],
];

function serializeValues(definition) {
  if (definition.type === 'colors') {
    return definition.values.map((entry) => [entry.key, entry.label, entry.value, entry.active === false ? 'OFF' : 'ON'].join(' | ')).join('\n');
  }
  if (definition.type === 'quotes') {
    return definition.values.map((entry) => [entry.text, entry.author, entry.source, entry.category, entry.active === false ? 'OFF' : 'ON'].join(' | ')).join('\n');
  }
  return (definition.values || []).map((entry) => typeof entry === 'string' ? entry : entry.label).join('\n');
}

function parseValues(definition, text) {
  const rows = text.split('\n').map((row) => row.trim()).filter(Boolean);
  if (definition.type === 'colors') {
    return rows.map((row, index) => {
      const [key, label, value, active] = row.split('|').map((part) => part.trim());
      return { key: key || `color-${index + 1}`, label: label || key, value: value || '#d84f86', active: active !== 'OFF', display_order: index + 1 };
    });
  }
  if (definition.type === 'quotes') {
    return rows.map((row, index) => {
      const [text, author, source, category, active] = row.split('|').map((part) => part.trim());
      return { id: `clock-quote-${index + 1}`, text, author, source, category: category || 'CUSTOM', verified: Boolean(author && source), active: active !== 'OFF' };
    }).filter((entry) => entry.text);
  }
  return rows;
}

function RegistryEditor({ registryKey, onSaved }) {
  const definition = getClockItDefinition(registryKey);
  const [text, setText] = useState(() => serializeValues(definition));
  const [numericDraft, setNumericDraft] = useState(() => ({
    min: definition.min ?? 0,
    max: definition.max ?? 100,
    step: definition.step ?? 1,
    unit: definition.unit || '',
  }));

  const save = () => {
    const patch = definition.type === 'numeric' ? {
      min: Number(numericDraft.min),
      max: Number(numericDraft.max),
      step: definition.stepLocked ? definition.step : Number(numericDraft.step),
      unit: numericDraft.unit,
    } : { values: parseValues(definition, text) };
    saveClockItDefinition(registryKey, patch);
    onSaved(`${definition.label} SAVED`);
  };

  const reset = () => {
    resetClockItDefinition(registryKey);
    const restored = getClockItDefinition(registryKey);
    setText(serializeValues(restored));
    setNumericDraft({ min: restored.min ?? 0, max: restored.max ?? 100, step: restored.step ?? 1, unit: restored.unit || '' });
    onSaved(`${definition.label} RESTORED`);
  };

  if (definition.type === 'locked') {
    return (
      <div className="clockit-editor clockit-editor-locked">
        <div className="clockit-editor-heading"><h3>{definition.label}</h3><span>LOCKED SYSTEM CHOICE</span></div>
        <div className="clockit-locked-values">{definition.values.map((value) => <span key={value}>{value}</span>)}</div>
      </div>
    );
  }

  if (definition.type === 'numeric') {
    return (
      <div className="clockit-editor">
        <div className="clockit-editor-heading"><h3>{definition.label}</h3><span>ROLLING PICKER</span></div>
        <div className="clockit-number-grid">
          <label>MIN<input type="number" value={numericDraft.min} onChange={(event) => setNumericDraft((prev) => ({ ...prev, min: event.target.value }))} /></label>
          <label>MAX<input type="number" value={numericDraft.max} onChange={(event) => setNumericDraft((prev) => ({ ...prev, max: event.target.value }))} /></label>
          <label>STEP<input type="number" value={numericDraft.step} disabled={definition.stepLocked} onChange={(event) => setNumericDraft((prev) => ({ ...prev, step: event.target.value }))} /></label>
          <label>UNIT<input value={numericDraft.unit} onChange={(event) => setNumericDraft((prev) => ({ ...prev, unit: event.target.value.toUpperCase() }))} /></label>
        </div>
        {definition.display === 'feet-inches' ? <small>DISPLAYED AS FEET + INCHES</small> : null}
        <div className="clockit-actions"><button type="button" onClick={save}>SAVE</button><button type="button" onClick={reset}>RESTORE DEFAULT</button></div>
      </div>
    );
  }

  const formatHint = definition.type === 'colors'
    ? 'KEY | LABEL | HEX | ON/OFF'
    : definition.type === 'quotes'
      ? 'QUOTE | AUTHOR | SOURCE | CATEGORY | ON/OFF'
      : 'ONE OPTION PER LINE';

  return (
    <div className="clockit-editor">
      <div className="clockit-editor-heading"><h3>{definition.label}</h3><span>{definition.type.toUpperCase()}</span></div>
      <small>{formatHint}</small>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={12} />
      <div className="clockit-actions"><button type="button" onClick={save}>SAVE</button><button type="button" onClick={reset}>RESTORE DEFAULT</button></div>
    </div>
  );
}

export default function ClockItSection() {
  const [activeSection, setActiveSection] = useState(sections[0]);
  const keys = useMemo(() => Object.keys(CLOCK_IT_REGISTRY).filter((key) => CLOCK_IT_REGISTRY[key].section === activeSection), [activeSection]);
  const [status, setStatus] = useState('');

  const chooseSection = (section) => {
    setActiveSection(section);
    setStatus('');
  };

  return (
    <section className="clockit-page">
      <div className="clockit-layout">
        <aside className="clockit-art" aria-hidden="true" />
        <main className="clockit-controls">
          <header className="clockit-header">
            <div><span>CHAOTICA CONTROL ARCHIVE</span><h1>{activeSection} DROPDOWNS</h1></div>
            <label>
              <span>CHOOSE APP SECTION</span>
              <select value={activeSection} onChange={(event) => chooseSection(event.target.value)}>
                {sections.map((section) => <option key={section}>{section}</option>)}
              </select>
            </label>
          </header>
          <p className="clockit-section-note">Each dropdown is separate. Edit only the field you intend to change.</p>
          <div className="clockit-section-grid">
            {keys.map((key) => <RegistryEditor key={key} registryKey={key} onSaved={setStatus} />)}
          </div>
          {activeSection === 'LOCKED SYSTEM' ? (
            <section className="clockit-legend-book" aria-label="CHAOTICA legend book">
              <header><span>REFERENCE + REPAIR MAP</span><h2>LEGEND BOOK</h2></header>
              <div className="clockit-legend-columns">
                <div><h3>SYSTEMS</h3>{LEGEND_SYSTEMS.map(([name, description]) => <dl key={name}><dt>{name}</dt><dd>{description}</dd></dl>)}</div>
                <div><h3>GLYPHS + UTILITIES</h3>{LEGEND_UTILITIES.map(([name, description]) => <dl key={name}><dt>{name}</dt><dd>{description}</dd></dl>)}<p><strong>IF A VALUE IS WRONG:</strong> CHOOSE ITS APP SECTION ABOVE, EDIT ONLY THAT CONTROL, THEN SAVE. RESTORE DEFAULT REVERSES ONLY THAT CONTROL.</p></div>
              </div>
            </section>
          ) : null}
          {status ? <p className="clockit-status" role="status">{status}</p> : null}
        </main>
      </div>
    </section>
  );
}
