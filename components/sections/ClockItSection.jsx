'use client';

import { useState } from 'react';
import '../../styles/sections/clock-it.css';
import { SETTINGS_GROUPS, getDropdownOptions, emitDropdownSettingsChanged } from '../../lib/dropdowns/dropdownOptions';
import { readSettings, writeSettings } from '../../lib/mmocStore';

export default function ClockItSection() {
  const [drafts, setDrafts] = useState(() => {
    const initial = {};
    SETTINGS_GROUPS.forEach((group) => {
      group.items.forEach(({ key }) => {
        initial[key] = getDropdownOptions(key).join('\n');
      });
    });
    return initial;
  });

  const saveOptions = (key) => {
    const values = (drafts[key] || '').split('\n').map((v) => v.trim()).filter(Boolean);
    const settings = readSettings();
    writeSettings({
      ...settings,
      optionOverrides: {
        ...(settings.optionOverrides || {}),
        [key]: values
      }
    });
    emitDropdownSettingsChanged();
  };

  return (
    <section className="clockit-page">
      <div className="clockit-layout">
        <aside className="clockit-art" aria-hidden="true" />
        <main className="clockit-controls">
          <section className="clockit-row">
            <h2>DROPDOWN HEADQUARTERS</h2>
            <div className="clockit-grid">
              {SETTINGS_GROUPS.map((group) => (
                <article key={group.title} className="clockit-panel">
                  <h3>{group.title}</h3>
                  <div className="clockit-list">
                    {group.items.map(({ key, label }) => (
                      <label key={key}>
                        <span>{label}</span>
                        <textarea
                          value={drafts[key] || ''}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                          rows={6}
                        />
                        <button type="button" onClick={() => saveOptions(key)}>SAVE {label}</button>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </section>
  );
}
