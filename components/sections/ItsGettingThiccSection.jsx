'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { addClient, appendLog, loadClients, readMedia, saveClients, upsertMedia } from '../../src/services/itsGettingThiccService';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const cabinetTabs = ['THICC.INFO', 'THICC.PEOPLE', 'THICC.FORMS', 'THICC.TIME'];
const foodQuestions = [
  'WHAT DO YOU STRUGGLE THE HARDEST TO STAY AWAY FROM?',
  'WHEN DO YOU USUALLY REACH FOR IT? (TIME, MOOD, SITUATION)',
  'GROWING UP, WERE YOU FORCED TO FINISH YOUR PLATE, AND HOW HAS THAT AFFECTED YOUR EATING HABITS?',
  'WERE THERE FOOD RULES, PUNISHMENTS, PRESSURE, OR EMOTIONALLY CHARGED EXPERIENCES AROUND EATING GROWING UP THAT STILL AFFECT HOW YOU EAT NOW?',
  'HOW DO YOUR EMOTIONS AND FOOD INTERACT TODAY?'
];
const movementQuestions = [
  'WALK ME THROUGH A TYPICAL DAY OF EATING.',
  'WALK ME THROUGH A NORMAL DAY IN YOUR BODY.',
  'HOW MUCH OF YOUR DAY IS SITTING VS ACTUALLY MOVING?',
  'WHEN DO YOU FEEL MOST PHYSICALLY ALIVE?'
];

export default function ItsGettingThiccSection() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [activeTab, setActiveTab] = useState('THICC.INFO');
  const active = useMemo(() => clients.find((c) => c.id === activeId) || clients[0], [clients, activeId]);

  useEffect(() => {
    const seeded = loadClients();
    setClients(seeded);
    setActiveId(seeded[0]?.id || '');
  }, []);

  const persist = (next, event = 'autosave') => {
    setClients(next);
    saveClients(next);
    appendLog(event, { activeId });
  };

  const update = (key, value) => {
    if (!active) return;
    const next = clients.map((c) => (c.id === active.id ? { ...c, [key]: value } : c));
    if (key === 'name') {
      const clean = value.trim().toLowerCase().replace(/\s+/g, '-');
      persist(next.map((c) => (c.id === active.id ? { ...c, fileName: clean || c.id.toLowerCase() } : c)), `field:${key}:rename`);
      return;
    }
    persist(next, `field:${key}`);
  };

  const updateArray = (key, i, value) => update(key, (active[key] || []).map((v, idx) => (idx === i ? value : v)));

  const onUpload = (slot) => (e) => {
    const f = e.target.files?.[0];
    if (!f || !active) return;
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = upsertMedia(active.id, slot, fr.result);
      if (slot === 'photo') update('photo', dataUrl);
      else updateArray('celebration', Number(slot), dataUrl);
    };
    fr.readAsDataURL(f);
  };

  if (!active) return null;
  const glancePhoto = active.photo || readMedia(active.id, 'photo');

  return (
    <section className="igtv2-page">
      <div className="igtv2-shell">
        <aside className="igtv2-left glass">
          <div className="igtv2-cabinet">
            {cabinetTabs.map((tab) => (
              <button key={tab} className={`igtv2-cabinet-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </aside>

        <main className="igtv2-right glass">
          {activeTab === 'THICC.INFO' && (
            <>
              <section className="glass section"><h3>NEW CLIENT DOSSIER TEMPLATE</h3><button onClick={() => { const c = addClient(); const next = [...clients, c]; persist(next, 'create-client'); setActiveId(c.id); }}>+ NEW CLIENT</button></section>
              <section className="glass section"><h3>1. CLIENT IDENTITY</h3><label>PHOTO</label><label className="upload">{glancePhoto ? <img src={glancePhoto} alt="client" /> : 'UPLOAD'}<input type="file" accept="image/*" onChange={onUpload('photo')} /></label>{['name', 'id', 'phone', 'age', 'email'].map((k) => <label key={k}>{k.toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>2. BODY / GOAL</h3>{['currentWeight', 'goalWeight', 'currentBmi', 'goalBmi'].map((k) => <label key={k}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>3. AT A GLANCE</h3>{glancePhoto && <img src={glancePhoto} alt="glance" className="thumb" />}<p>HEIGHT: {active.heightFt}' {active.heightIn}"</p><p>CURRENT WEIGHT: {active.currentWeight}</p><p>GOAL WEIGHT: {active.goalWeight}</p></section>
              <section className="glass section"><h3>4. FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{foodQuestions.map((q, i) => <label key={q}>{q}<textarea value={active[`food${i + 1}`] || ''} onChange={(e) => update(`food${i + 1}`, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>5. MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{movementQuestions.map((q, i) => <label key={q}>{q}<textarea value={active[`move${i + 1}`] || ''} onChange={(e) => update(`move${i + 1}`, e.target.value)} /></label>)}<label>ACTIVITY LEVEL DROPDOWN<select value={active.activity || ''} onChange={(e) => update('activity', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.activityLevel.map((o) => <option key={o}>{o}</option>)}</select></label></section>
              <section className="glass section"><h3>6. MEDICAL ADVISORY</h3>{[['medEmergency', 'EMERGENCY CONTACT NAME / NUMBER'], ['medInjuries', 'PAST / CURRENT INJURIES'], ['medSurgeries', 'PAST / UPCOMING SURGERIES'], ['medAllergies', 'RECURRING SEASONAL ISSUES / ALLERGIES'], ['medMeds', 'MEDICATIONS THAT COULD CAUSE COMPLICATIONS'], ['medLimits', 'PHYSICAL LIMITATIONS'], ['medPain', 'MOVEMENTS THAT CAUSE PAIN'], ['medFlex', 'FLEXIBILITY LEVEL'], ['medHardNo', 'HARD NO’S'], ['medFears', 'TRAINING FEARS']].map(([k, l]) => <label key={k}>{l}<textarea value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>7. MACRO TARGETS</h3>{['macroProtein', 'macroCarbs', 'macroFats', 'macroWater', 'macroCalories'].map((k) => <label key={k}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>8. DA.JUICE MIRROR</h3>{[['juiceSubstance', 'SUBSTANCE'], ['juiceShot', 'INTENSITY / AMOUNT'], ['juiceCycle', 'DURATION / CYCLE'], ['juiceLocation', 'LOCATION'], ['juiceNotes', 'NOTES']].map(([k, l]) => <label key={k}>{l}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
              <section className="glass section"><h3>9. SEASONS PER WEEK</h3><label>SEASONS PER WEEK<input type="number" value={active.seasonsPerWeek || ''} onChange={(e) => update('seasonsPerWeek', e.target.value)} /></label></section>
              <section className="glass section"><h3>10. REFERRAL TRACKER</h3><button onClick={() => update('referrals', [...active.referrals, { name: '', date: '', status: '' }])}>ADD REFERRAL</button></section>
              <section className="glass section"><h3>11. TRAINING / REST CALENDAR</h3><div className="hz">{days.map((d, i) => <label key={d}>{d}<select value={active.trainingRest?.[i] || 'TRAINING'} onChange={(e) => updateArray('trainingRest', i, e.target.value)}>{optionRegistry.itsGettingThicc.trainingRest.map((o) => <option key={o}>{o}</option>)}</select></label>)}</div></section>
              <section className="glass section"><h3>12. CURRENT EXERCISE PROGRAM SPLIT</h3><div className="hz">{days.map((d, i) => <label key={d}>{d}<select value={active.programSplit?.[i] || 'FULLBODY'} onChange={(e) => updateArray('programSplit', i, e.target.value)}>{optionRegistry.itsGettingThicc.programSplit.map((o) => <option key={o}>{o}</option>)}</select></label>)}</div></section>
              <section className="glass section"><h3>13. UPCOMING TRAINING FOCUS EVENTS</h3><textarea value={active.upcomingEventsNotes || ''} onChange={(e) => update('upcomingEventsNotes', e.target.value)} /></section>
              <section className="glass section"><h3>14. PAYMENT</h3><label>PAYMENT DATE<input type="date" value={active.paymentDate || ''} onChange={(e) => update('paymentDate', e.target.value)} /></label></section>
              <section className="glass section"><h3>15. THICC THOUGHTS</h3><textarea className="big" value={active.thoughts || ''} onChange={(e) => update('thoughts', e.target.value)} /></section>
              <section className="glass section"><h3>16. MYFITFOODS CHECK-IN</h3><label>NOTES<textarea value={active.myfitNotes || ''} onChange={(e) => update('myfitNotes', e.target.value)} /></label></section>
              <section className="glass section"><h3>17. CELEBRATION MOMENTS</h3><div className="cele">{(active.celebration || []).map((img, i) => <label key={i} className="slot">{img ? <img src={img} alt="" /> : `${i + 1}`}<input type="file" accept="image/*" onChange={onUpload(String(i))} /></label>)}</div></section>
              <section className="glass section"><button className="inline-del" onClick={() => { const next = clients.filter((c) => c.id !== active.id); persist(next, 'delete-client'); setActiveId(next[0]?.id || ''); }}>DELETE CLIENT</button></section>
            </>
          )}

          {activeTab === 'THICC.PEOPLE' && (
            <section className="glass section">
              <h3>SAVED CLIENT PROFILES</h3>
              <div className="people-list">
                {clients.map((client) => (
                  <button key={client.id} className={`people-item ${active.id === client.id ? 'active' : ''}`} onClick={() => { setActiveId(client.id); setActiveTab('THICC.INFO'); }}>
                    <span>{client.name || client.id}</span>
                    <span>{client.id}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'THICC.FORMS' && (
            <section className="glass section">
              <h3>OPERATIONS FORMS LIBRARY</h3>
              <ul className="forms-list">
                <li>COACHING CHECK-IN SHELL</li>
                <li>NUTRITION ADHERENCE REVIEW</li>
                <li>SESSION RECAP / ACTION ITEMS</li>
                <li>PROGRAM UPDATE REQUEST</li>
              </ul>
            </section>
          )}

          {activeTab === 'THICC.TIME' && (
            <section className="glass section">
              <h3>THICC.TIME MONTH VIEW SCHEDULER</h3>
              <div className="time-grid">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => <strong key={d}>{d}</strong>)}
                {Array.from({ length: 35 }).map((_, idx) => <button key={idx} className="time-day">{idx + 1}</button>)}
              </div>
              <p>COLOR KEY: CLIENT SESSIONS + MISTA.THICC TRAINING TIMES.</p>
              <p>MULTI-ENTRY PER DAY READY (SHELL).</p>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}
