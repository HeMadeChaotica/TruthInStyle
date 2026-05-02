'use client';

import { useState } from 'react';

const workoutLengths = ['20 MIN', '30 MIN', '45 MIN', '90 MIN', '120 MIN'];

export default function ThiccFittSection() {
  const [exerciseRows, setExerciseRows] = useState([{ exercise: '', sets: '', reps: '', weight: '', notes: '' }]);
  const [vaultRows, setVaultRows] = useState([{ compound: '', amount: '', cycle: '' }]);

  return (
    <section className="thicc-fitt-screen">
      <header className="thicc-header-strip">
        <div className="header-item header-anchor">
          <span className="label">SECTION ANCHOR</span>
          <strong>THICC.FITT</strong>
        </div>

        <a className="header-item crystal-trigger" href="/its-getting-thicc">
          <span className="label">CRYSTAL DUMBBELL</span>
          <strong>OPEN</strong>
        </a>

        <div className="header-item gym-location">
          <span className="label">GYM LOCATION</span>
          <div className="inline-controls">
            <input placeholder="Gym location" />
            <button type="button">Use GPS</button>
          </div>
        </div>

        <div className="header-item">
          <span className="label">SEASON</span>
          <select>
            <option>BULKING SEASON</option>
            <option>CUTTING SEASON</option>
          </select>
        </div>

        <div className="header-item">
          <span className="label">WORKOUT LENGTH</span>
          <select>
            {workoutLengths.map((length) => (
              <option key={length}>{length}</option>
            ))}
          </select>
        </div>

        <div className="header-item">
          <span className="label">ARRIVAL TIME</span>
          <input type="time" defaultValue="06:15" />
        </div>
      </header>

      <div className="row row-one">
        <section className="panel exercise-log">
          <h2>EXERCISE LOG</h2>
          <button type="button">+ ADD EXERCISE</button>
          {exerciseRows.map((row, i) => (
            <div className="row-inputs" key={`exercise-${i}`}>
              <input placeholder="Exercise" defaultValue={row.exercise} />
              <input placeholder="Sets" defaultValue={row.sets} />
              <input placeholder="Reps" defaultValue={row.reps} />
              <input placeholder="Weight" defaultValue={row.weight} />
              <input placeholder="Notes" defaultValue={row.notes} />
            </div>
          ))}
          <button type="button" onClick={() => setExerciseRows([...exerciseRows, { exercise: '', sets: '', reps: '', weight: '', notes: '' }])}>Add Row</button>
        </section>

        <section className="panel media-panel">
          <h2>MEDIA</h2>
          <input type="file" multiple />
          <div className="media-preview">Preview area</div>
        </section>

        <section className="panel notes-panel">
          <h2>NOTES + SO HOW YOU DOIN 🫪⁉️</h2>
          <select>
            <option>How are you feeling?</option>
          </select>
          <textarea placeholder="Write your response here..." />
        </section>
      </div>

      <div className="row row-two">
        <section className="panel vault-panel">
          <h2>THE VAULT</h2>
          <button type="button">+ ADD ENTRY</button>
          {vaultRows.map((row, i) => (
            <div className="row-inputs vault-inputs" key={`vault-${i}`}>
              <input placeholder="Compound" defaultValue={row.compound} />
              <input placeholder="Amount" defaultValue={row.amount} />
              <input placeholder="Cycle" defaultValue={row.cycle} />
            </div>
          ))}
          <button type="button" onClick={() => setVaultRows([...vaultRows, { compound: '', amount: '', cycle: '' }])}>Add Row</button>
        </section>

        <section className="panel cardio-panel">
          <h2>CARDIO</h2>
          <input placeholder="Type" />
          <input placeholder="Duration" />
          <input placeholder="Intensity" />
          <div className="inline-controls">
            <input placeholder="Cardio location" />
            <button type="button">Use GPS</button>
          </div>
          <textarea placeholder="Notes" />
        </section>

        <section className="panel body-panel">
          <h2>BODY MEASUREMENTS</h2>
          <div className="measurement-grid">
            {['Weight', 'Body Fat %', 'Chest', 'Waist', 'Hips', 'Arms L', 'Arms R', 'Thighs L', 'Thighs R', 'Glutes'].map((field) => (
              <label key={field}>
                <span>{field}</span>
                <input />
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="screen-footer-space" />
    </section>
  );
}
