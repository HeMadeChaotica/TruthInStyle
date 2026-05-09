'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { addClient, appendLog, loadClients, readMedia, saveClients, upsertMedia } from '../../src/services/itsGettingThiccService';

const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function ItsGettingThiccSection() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [rosterOpen, setRosterOpen] = useState(false);
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
          <div className="igtv2-left-top">
            <Link href="/clock-it" className="igtv2-clock">CLOCK.IT</Link>
            <button className="igtv2-thicc" onClick={() => setRosterOpen((v) => !v)}>THICC.INFO</button>
            {rosterOpen && (
              <div className="igtv2-roster glass">
                <select value={active.id} onChange={(e) => { setActiveId(e.target.value); setRosterOpen(false); }}>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                </select>
                <button onClick={() => { const c = addClient(); const next = [...clients, c]; persist(next, 'create-client'); setActiveId(c.id); }}>+ NEW CLIENT</button>
              </div>
            )}
          </div>
          <div className="igtv2-dossier-title">CLIENT DOSSIER HEADQUARTERS</div>
          <div className="igtv2-worldcopy">MISTA.THICC KNOWS A WINNER WHEN HE SEES ONE AND KNOWS HOW TO BUILD ONE.</div>
        </aside>

        <main className="igtv2-right glass">
          <section className="glass section"><h3>1. CLIENT IDENTITY</h3><label>PHOTO</label><label className="upload">{glancePhoto ? <img src={glancePhoto} alt="client" /> : 'UPLOAD'}<input type="file" accept="image/*" onChange={onUpload('photo')} /></label>
          {['name','id','phone','age','email'].map((k) => <label key={k}>{k.toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}
          <label>SEX<select value={active.sex || ''} onChange={(e) => update('sex', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.sex.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>SEXUAL ORIENTATION<select value={active.orientation || ''} onChange={(e) => update('orientation', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.sexualOrientation.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>HEIGHT<input value={active.heightFt || ''} onChange={(e) => update('heightFt', e.target.value)} placeholder="FT" /><input value={active.heightIn || ''} onChange={(e) => update('heightIn', e.target.value)} placeholder="IN" /></label>
          <label>MARITAL STATUS<select value={active.married ? 'MARRIED' : active.single ? 'SINGLE' : ''} onChange={(e) => { update('married', e.target.value === 'MARRIED'); update('single', e.target.value === 'SINGLE'); }}><option value="" /><option>MARRIED</option><option>SINGLE</option></select></label></section>

          <section className="glass section"><h3>2. BODY / GOAL</h3>{['currentWeight','goalWeight','currentBmi','goalBmi'].map((k) => <label key={k}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
          <section className="glass section"><h3>3. AT A GLANCE</h3>{glancePhoto && <img src={glancePhoto} alt="glance" className="thumb" />}<p>HEIGHT: {active.heightFt}' {active.heightIn}"</p><p>CURRENT WEIGHT: {active.currentWeight}</p><p>GOAL WEIGHT: {active.goalWeight}</p><p>CURRENT BMI: {active.currentBmi}</p><p>GOAL BMI: {active.goalBmi}</p></section>
          <section className="glass section"><h3>4. FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{[1,2,3,4,5].map((n) => <label key={n}>PROMPT {n}<textarea value={active[`food${n}`] || ''} onChange={(e) => update(`food${n}`, e.target.value)} /></label>)}</section>
          <section className="glass section"><h3>5. MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{[1,2,3,4,5].map((n) => <label key={n}>PROMPT {n}<textarea value={active[`move${n}`] || ''} onChange={(e) => update(`move${n}`, e.target.value)} /></label>)}<label>ACTIVITY LEVEL<select value={active.activity || ''} onChange={(e) => update('activity', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.activityLevel.map((o) => <option key={o}>{o}</option>)}</select></label></section>
          <section className="glass section"><h3>6. MEDICAL ADVISORY</h3>{[['medEmergency','EMERGENCY CONTACT'],['medInjuries','INJURIES'],['medSurgeries','SURGERIES'],['medAllergies','ALLERGIES / SEASONAL'],['medMeds','MEDICATIONS'],['medLimits','PHYSICAL LIMITATIONS'],['medPain','PAIN TRIGGERS'],['medHardNo','HARD NO\'S'],['medFears','TRAINING FEARS']].map(([k,l]) => <label key={k}>{l}<textarea value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}<label>FLEXIBILITY LEVEL<select value={active.medFlex || ''} onChange={(e) => update('medFlex', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.flexibilityLevel.map((o) => <option key={o}>{o}</option>)}</select></label></section>
          <section className="glass section"><h3>7. MACRO TARGETS</h3>{['macroProtein','macroCarbs','macroFats','macroWater','macroCalories'].map((k) => <label key={k}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
          <section className="glass section"><h3>8. DA.JUICE MIRROR</h3>{[['juiceSubstance','SUBSTANCE'],['juiceShot','INTENSITY / AMOUNT'],['juiceCycle','DURATION / CYCLE'],['juiceLocation','LOCATION'],['juiceNotes','NOTES']].map(([k,l]) => <label key={k}>{l}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</section>
          <section className="glass section"><h3>9. SEASONS PER WEEK</h3><label>SEASONS PER WEEK<input type="number" value={active.seasonsPerWeek || ''} onChange={(e) => update('seasonsPerWeek', e.target.value)} /></label></section>
          <section className="glass section"><h3>10. REFERRAL TRACKER</h3>{(active.referrals || []).map((r, i) => <div key={i} className="row"><input placeholder="NAME" value={r.name} onChange={(e) => update('referrals', active.referrals.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} /><input type="date" value={r.date} onChange={(e) => update('referrals', active.referrals.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))} /><select value={r.status || ''} onChange={(e) => update('referrals', active.referrals.map((x, idx) => idx === i ? { ...x, status: e.target.value } : x))}><option value="" /><option>PENDING</option><option>CONVERTED</option></select></div>)}<button onClick={() => update('referrals', [...active.referrals, { name: '', date: '', status: '' }])}>ADD REFERRAL</button></section>
          <section className="glass section"><h3>11. TRAINING / REST CALENDAR</h3><div className="hz">{days.map((d, i) => <label key={d}>{d}<select value={active.trainingRest?.[i] || 'TRAINING'} onChange={(e) => updateArray('trainingRest', i, e.target.value)}>{optionRegistry.itsGettingThicc.trainingRest.map((o) => <option key={o}>{o}</option>)}</select></label>)}</div></section>
          <section className="glass section"><h3>12. CURRENT EXERCISE PROGRAM SPLIT</h3><div className="hz">{days.map((d, i) => <label key={d}>{d}<select value={active.programSplit?.[i] || 'FULLBODY'} onChange={(e) => updateArray('programSplit', i, e.target.value)}>{optionRegistry.itsGettingThicc.programSplit.map((o) => <option key={o}>{o}</option>)}</select></label>)}</div></section>
          <section className="glass section"><h3>13. UPCOMING TRAINING FOCUS EVENTS</h3>{(active.upcomingEvents || []).map((ev, i) => <div key={i} className="row"><select value={ev.type} onChange={(e) => update('upcomingEvents', active.upcomingEvents.map((x, idx) => idx === i ? { ...x, type: e.target.value } : x))}>{optionRegistry.itsGettingThicc.upcomingTrainingEventType.map((o) => <option key={o}>{o}</option>)}</select><input type="date" value={ev.date || ''} onChange={(e) => update('upcomingEvents', active.upcomingEvents.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))} /></div>)}</section>
          <section className="glass section"><h3>14. PAYMENT</h3><label>PAYMENT SCHEDULE<select value={active.paymentSchedule || ''} onChange={(e) => update('paymentSchedule', e.target.value)}><option value="" />{optionRegistry.itsGettingThicc.paymentSchedule.map((o) => <option key={o}>{o}</option>)}</select></label><label>PAYMENT DATE<input type="date" value={active.paymentDate || ''} onChange={(e) => update('paymentDate', e.target.value)} /></label><label>NOTES<textarea value={active.paymentNotes || ''} onChange={(e) => update('paymentNotes', e.target.value)} /></label></section>
          <section className="glass section"><h3>15. THICC THOUGHTS</h3><textarea className="big" value={active.thoughts || ''} onChange={(e) => update('thoughts', e.target.value)} /></section>
          <section className="glass section"><h3>16. MYFITFOODS CHECK-IN</h3><label>MEALS PER WEEK<input value={active.myfitMeals || ''} onChange={(e) => update('myfitMeals', e.target.value)} /></label><label><input type="checkbox" checked={!!active.myfitVerified} onChange={(e) => update('myfitVerified', e.target.checked)} /> VERIFIED</label><label>NOTES<textarea value={active.myfitNotes || ''} onChange={(e) => update('myfitNotes', e.target.value)} /></label></section>
          <section className="glass section"><h3>17. CELEBRATION MOMENTS</h3><div className="cele">{(active.celebration || []).map((img, i) => <label key={i} className="slot">{img ? <img src={img} alt="" /> : `${i + 1}`}<input type="file" accept="image/*" onChange={onUpload(String(i))} /></label>)}</div></section>
          <section className="glass section"><h3>18. SMALL INLINE DELETE CONTROL</h3><button className="inline-del" onClick={() => { const next = clients.filter((c) => c.id !== active.id); persist(next, 'delete-client'); setActiveId(next[0]?.id || ''); }}>DELETE CURRENT CLIENT</button></section>
        </main>
      </div>
    </section>
  );
}
