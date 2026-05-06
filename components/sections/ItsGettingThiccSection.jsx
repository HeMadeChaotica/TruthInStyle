'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import { addClient, appendLog, loadClients, readMedia, saveClients, upsertMedia } from '../../src/services/itsGettingThiccService';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ItsGettingThiccSection() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState('');
  const active = useMemo(() => clients.find((c) => c.id === activeId) || clients[0], [clients, activeId]);

  useEffect(() => { const seeded = loadClients(); setClients(seeded); setActiveId(seeded[0]?.id || ''); }, []);

  const persist = (next, event = 'autosave') => { setClients(next); saveClients(next); appendLog(event, { activeId }); };

  const update = (key, value) => {
    const next = clients.map((c) => c.id === active.id ? { ...c, [key]: value, ...(key === 'name' ? { fileName: value.trim().toLowerCase().replace(/\s+/g, '-') } : {}) } : c);
    persist(next, `field:${key}`);
  };

  const updateArray = (key, i, value) => update(key, active[key].map((v, idx) => idx === i ? value : v));

  const onUpload = (slot) => (e) => {
    const f = e.target.files?.[0]; if (!f || !active) return;
    const fr = new FileReader();
    fr.onload = () => { const url = upsertMedia(active.id, slot, fr.result); if (slot === 'photo') update('photo', url); else updateArray('celebration', Number(slot), url); };
    fr.readAsDataURL(f);
  };

  if (!active) return null;
  const glancePhoto = active.photo || readMedia(active.id, 'photo');

  return <section className="igt-page"><div className="igt-shell">
    <header className="igt-panel igt-topbar"><button className="igt-thicc-info">THICC.INFO</button>
      <select value={active.id} onChange={(e) => setActiveId(e.target.value)}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}</select>
      <button onClick={() => { const c = addClient(); const next = [...clients, c]; persist(next, 'create-client'); setActiveId(c.id); }}>+</button>
    </header>

    <main className="igt-grid">
      <section className="igt-panel"><h3>CLIENT IDENTITY</h3><div className="two"><label className="upload">{glancePhoto ? <img src={glancePhoto} alt="client" /> : 'UPLOAD PHOTO'}<input type="file" accept="image/*" onChange={onUpload('photo')} /></label>
      <div className="fields">{['name','id','phone','age','email'].map((k) => <input key={k} placeholder={k.toUpperCase()} value={active[k]||''} onChange={(e)=>update(k,e.target.value)} />)}
      <div className="row"><select value={active.sex} onChange={(e)=>update('sex',e.target.value)}><option value="">SEX</option><option>Male</option><option>Female</option><option>Other</option></select>
      <select value={active.orientation} onChange={(e)=>update('orientation',e.target.value)}><option value="">SEXUAL ORIENTATION</option><option>Straight</option><option>Gay</option><option>Bi</option><option>Other</option></select></div>
      <div className="row"><input placeholder="HEIGHT FT" value={active.heightFt} onChange={(e)=>update('heightFt',e.target.value)} /><input placeholder="HEIGHT IN" value={active.heightIn} onChange={(e)=>update('heightIn',e.target.value)} /><input placeholder="HEIGHT CM" value={active.heightCm} onChange={(e)=>update('heightCm',e.target.value)} /></div>
      <div className="row"><label><input type="checkbox" checked={active.married} onChange={(e)=>update('married',e.target.checked)} />Married</label><label><input type="checkbox" checked={active.single} onChange={(e)=>update('single',e.target.checked)} />Single</label></div>
      </div></div></section>

      <section className="igt-panel"><h3>BODY / GOAL</h3>{['currentWeight','goalWeight','currentBmi','goalBmi'].map((k)=><input key={k} placeholder={k} value={active[k]} onChange={(e)=>update(k,e.target.value)} />)}</section>
      <section className="igt-panel"><h3>AT A GLANCE</h3><div className="glance">{glancePhoto && <img src={glancePhoto} alt="glance"/>}<p>Height: {active.heightFt}'{active.heightIn}" {active.heightCm && `(${active.heightCm}cm)`}</p><p>CW: {active.currentWeight}</p><p>GW: {active.goalWeight}</p><p>CBMI: {active.currentBmi}</p><p>GBMI: {active.goalBmi}</p></div></section>
      <section className="igt-panel wide"><h3>FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{[1,2,3,4,5].map((n)=><input key={n} value={active[`food${n}`]} onChange={(e)=>update(`food${n}`,e.target.value)} placeholder={`prompt ${n}`} />)}</section>
      <section className="igt-panel wide"><h3>MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{[1,2,3,4].map((n)=><input key={n} value={active[`move${n}`]} onChange={(e)=>update(`move${n}`,e.target.value)} placeholder={`movement ${n}`} />)}<select value={active.activity} onChange={(e)=>update('activity',e.target.value)}><option value=''>activity</option>{['Sedentary','Lightly','Moderately','Active','I do this S@$&!','I swear I’m active but my Apple Watch says otherwise'].map(o=><option key={o}>{o}</option>)}</select></section>
      <section className="igt-panel wide"><h3>MEDICAL ADVISORY</h3>{[['medEmergency','Emergency'],['medInjuries','Injuries'],['medSurgeries','Surgeries'],['medAllergies','Allergies'],['medMeds','Medications'],['medLimits','Limitations'],['medPain','Pain triggers'],['medFlex','Flexibility level'],['medHardNo','Hard no’s'],['medFears','Training fears']].map(([k,l])=><input key={k} placeholder={l} value={active[k]} onChange={(e)=>update(k,e.target.value)} />)}</section>
      <section className="igt-panel"><h3>MACRO TARGETS</h3>{['macroProtein','macroCarbs','macroFats','macroWater','macroCalories'].map(k=><input key={k} value={active[k]} onChange={(e)=>update(k,e.target.value)} placeholder={k} />)}</section>
      <section className="igt-panel"><h3>DA.JUICE MIRROR</h3>{['juiceSubstance','juiceShot','juiceCycle','juiceNotes'].map(k=><input key={k} value={active[k]} onChange={(e)=>update(k,e.target.value)} placeholder={k} />)}</section>
      <section className="igt-panel"><h3>SEASONS PER WEEK</h3><input value={active.seasonsPerWeek} onChange={(e)=>update('seasonsPerWeek',e.target.value)} /></section>
      <section className="igt-panel"><h3>REFERRAL TRACKER</h3>{active.referrals.map((r,i)=><div className="row" key={i}><input placeholder='Name' value={r.name} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,name:e.target.value}:x))}/><input type='date' value={r.date} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,date:e.target.value}:x))}/><input placeholder='Bonus Week' value={r.bonusWeek} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,bonusWeek:e.target.value}:x))}/></div>)}<button onClick={()=>update('referrals',[...active.referrals,{name:'',date:'',bonusWeek:''}])}>Add referral</button></section>
      <section className="igt-panel"><h3>TRAINING / REST CALENDAR</h3>{days.map((d,i)=><div className='row' key={d}><span>{d}</span><select value={active.trainingRest[i]} onChange={(e)=>updateArray('trainingRest',i,e.target.value)}><option>Training</option><option>Rest</option></select></div>)}</section>
      <section className="igt-panel"><h3>CURRENT EXERCISE PROGRAM SPLIT</h3>{days.map((d,i)=><div className='row' key={d}><span>{d}</span><select value={active.programSplit[i]} onChange={(e)=>updateArray('programSplit',i,e.target.value)}><option>FullBody</option><option>Upper</option><option>Lowwer</option></select></div>)}</section>
      <section className="igt-panel"><h3>UPCOMING TRAINING EVENTS</h3>{active.upcomingEvents.map((ev,i)=><div className='row' key={i}><select value={ev.type} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,type:e.target.value}:x))}><option>WEDDING</option><option>anniversary</option><option>Birthday</option><option>Vacation</option><option>Upcoming surgery</option><option>Custom</option></select>{ev.type==='Custom'&&<input value={ev.custom} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,custom:e.target.value}:x))} placeholder='Custom event'/>}<input type='date' value={ev.date} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,date:e.target.value}:x))}/></div>)}</section>
      <section className="igt-panel"><h3>PAYMENT</h3><input placeholder='Schedule' value={active.paymentSchedule} onChange={(e)=>update('paymentSchedule',e.target.value)} /><input type='date' value={active.paymentDate} onChange={(e)=>update('paymentDate',e.target.value)} /><input placeholder='Notes' value={active.paymentNotes} onChange={(e)=>update('paymentNotes',e.target.value)} /></section>
      <section className="igt-panel"><h3>THICC THOUGHTS</h3><textarea className='thoughts' value={active.thoughts} onChange={(e)=>update('thoughts',e.target.value)} /></section>
      <section className="igt-panel"><h3>MYFITFOODS CHECK-IN</h3><input placeholder='Meals per week' value={active.myfitMeals} onChange={(e)=>update('myfitMeals',e.target.value)} /><label><input type='checkbox' checked={active.myfitVerified} onChange={(e)=>update('myfitVerified',e.target.checked)} /> Verified with Anthony</label><textarea value={active.myfitNotes} onChange={(e)=>update('myfitNotes',e.target.value)} /></section>
      <section className="igt-panel full"><h3>CELEBRATION MOMENTS</h3><div className='cele'>{active.celebration.map((img,i)=><label key={i} className='slot'>{img?<img src={img} alt=''/>:`${i+1}`}<input type='file' accept='image/*' onChange={onUpload(String(i))}/></label>)}<button className='slot delete' onClick={()=>{ if(!confirm('Delete current client?')) return; const next=clients.filter(c=>c.id!==active.id); persist(next,'delete-client'); setActiveId(next[0]?.id||''); }}>-</button></div></section>
    </main>
  </div></section>;
}
