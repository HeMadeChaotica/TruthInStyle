'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import { addClient, appendLog, loadClients, readMedia, saveClients, upsertMedia } from '../../src/services/itsGettingThiccService';

const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

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
      <div className="row"><select value={active.sex} onChange={(e)=>update('sex',e.target.value)}><option value="">SEX</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></select>
      <select value={active.orientation} onChange={(e)=>update('orientation',e.target.value)}><option value="">SEXUAL ORIENTATION</option><option>STRAIGHT</option><option>GAY</option><option>BI</option><option>OTHER</option></select></div>
      <div className="row"><input placeholder="HEIGHT FT" value={active.heightFt} onChange={(e)=>update('heightFt',e.target.value)} /><input placeholder="HEIGHT IN" value={active.heightIn} onChange={(e)=>update('heightIn',e.target.value)} /><input placeholder="HEIGHT CM" value={active.heightCm} onChange={(e)=>update('heightCm',e.target.value)} /></div>
      <div className="row"><label><input type="checkbox" checked={active.married} onChange={(e)=>update('married',e.target.checked)} />MARRIED</label><label><input type="checkbox" checked={active.single} onChange={(e)=>update('single',e.target.checked)} />SINGLE</label></div>
      </div></div></section>

      <section className="igt-panel"><h3>BODY / GOAL</h3>{['currentWeight','goalWeight','currentBmi','goalBmi'].map((k)=><input key={k} placeholder={k.replace(/([A-Z])/g, ' $1').toUpperCase().trim()} value={active[k]} onChange={(e)=>update(k,e.target.value)} />)}</section>
      <section className="igt-panel"><h3>AT A GLANCE</h3><div className="glance">{glancePhoto && <img src={glancePhoto} alt="glance"/>}<p>HEIGHT: {active.heightFt}'{active.heightIn}" {active.heightCm && `(${active.heightCm}cm)`}</p><p>CURRENT WEIGHT: {active.currentWeight}</p><p>GOAL WEIGHT: {active.goalWeight}</p><p>CURRENT BMI: {active.currentBmi}</p><p>GOAL BMI: {active.goalBmi}</p></div></section>
      <section className="igt-panel wide"><h3>FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{[1,2,3,4,5].map((n)=><input key={n} value={active[`food${n}`]} onChange={(e)=>update(`food${n}`,e.target.value)} placeholder={['WHAT DO YOU STRUGGLE THE HARDEST TO STAY AWAY FROM?','WHEN DO YOU USUALLY REACH FOR IT? (TIME, MOOD, SITUATION)','GROWING UP, WERE YOU FORCED TO FINISH YOUR PLATE, AND HOW HAS THAT AFFECTED YOUR EATING HABITS IN ADULTHOOD?','WERE THERE FOOD RULES, PUNISHMENTS, PRESSURE, OR EMOTIONALLY CHARGED EXPERIENCES AROUND EATING GROWING UP THAT STILL AFFECT HOW YOU EAT NOW?','HOW DO YOUR EMOTIONS AND FOOD INTERACT TODAY?'][n-1]} />)}</section>
      <section className="igt-panel wide"><h3>MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{[1,2,3,4].map((n)=><input key={n} value={active[`move${n}`]} onChange={(e)=>update(`move${n}`,e.target.value)} placeholder={['WALK ME THROUGH A TYPICAL DAY OF EATING.','WALK ME THROUGH A NORMAL DAY IN YOUR BODY.','HOW MUCH OF YOUR DAY IS SITTING VS ACTUALLY MOVING?','WHEN DO YOU FEEL MOST PHYSICALLY ALIVE?'][n-1]} />)}<select value={active.activity} onChange={(e)=>update('activity',e.target.value)}><option value=''>ACTIVITY</option>{['SEDENTARY','LIGHTLY','MODERATELY','ACTIVE','I DO THIS S@$&!','I SWEAR I'M ACTIVE BUT MY APPLE WATCH SAYS OTHERWISE'].map(o=><option key={o}>{o}</option>)}</select></section>
      <section className="igt-panel wide"><h3>MEDICAL ADVISORY</h3>{[['medEmergency','EMERGENCY CONTACT NAME / NUMBER'],['medInjuries','PAST / CURRENT INJURIES'],['medSurgeries','PAST / UPCOMING SURGERIES'],['medAllergies','RECURRING SEASONAL ISSUES / ALLERGIES'],['medMeds','MEDICATIONS THAT COULD CAUSE COMPLICATIONS'],['medLimits','PHYSICAL LIMITATIONS'],['medPain','MOVEMENTS THAT CAUSE PAIN'],['medFlex','FLEXIBILITY LEVEL'],['medHardNo','HARD NO'S'],['medFears','TRAINING FEARS']].map(([k,l])=><input key={k} placeholder={l} value={active[k]} onChange={(e)=>update(k,e.target.value)} />)}</section>
      <section className="igt-panel"><h3>MACRO TARGETS</h3>{['macroProtein','macroCarbs','macroFats','macroWater','macroCalories'].map(k=><input key={k} value={active[k]} onChange={(e)=>update(k,e.target.value)} placeholder={k.replace(/([A-Z])/g, ' $1').toUpperCase().trim()} />)}</section>
      <section className="igt-panel"><h3>DA.JUICE MIRROR</h3>{['juiceSubstance','juiceShot','juiceCycle','juiceNotes'].map(k=><input key={k} value={active[k]} onChange={(e)=>update(k,e.target.value)} placeholder={k.replace(/([A-Z])/g, ' $1').toUpperCase().trim()} />)}</section>
      <section className="igt-panel"><h3>SEASONS PER WEEK</h3><input value={active.seasonsPerWeek} onChange={(e)=>update('seasonsPerWeek',e.target.value)} /></section>
      <section className="igt-panel"><h3>REFERRAL TRACKER</h3>{active.referrals.map((r,i)=><div className="row" key={i}><input placeholder='NAME' value={r.name} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,name:e.target.value}:x))}/><input type='date' value={r.date} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,date:e.target.value}:x))}/><input placeholder='BONUS WEEK' value={r.bonusWeek} onChange={(e)=>update('referrals',active.referrals.map((x,idx)=>idx===i?{...x,bonusWeek:e.target.value}:x))}/></div>)}<button onClick={()=>update('referrals',[...active.referrals,{name:'',date:'',bonusWeek:''}])}>ADD REFERRAL</button></section>
      <section className="igt-panel"><h3>TRAINING / REST CALENDAR</h3>{days.map((d,i)=><div className='row' key={d}><span>{d}</span><select value={active.trainingRest[i]} onChange={(e)=>updateArray('trainingRest',i,e.target.value)}><option>TRAINING</option><option>REST</option></select></div>)}</section>
      <section className="igt-panel"><h3>CURRENT EXERCISE PROGRAM SPLIT</h3>{days.map((d,i)=><div className='row' key={d}><span>{d}</span><select value={active.programSplit[i]} onChange={(e)=>updateArray('programSplit',i,e.target.value)}><option>FULLBODY</option><option>UPPER</option><option>LOWER</option></select></div>)}</section>
      <section className="igt-panel"><h3>UPCOMING TRAINING EVENTS</h3>{active.upcomingEvents.map((ev,i)=><div className='row' key={i}><select value={ev.type} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,type:e.target.value}:x))}><option>WEDDING</option><option>ANNIVERSARY</option><option>BIRTHDAY</option><option>VACATION</option><option>UPCOMING SURGERY</option><option>CUSTOM</option></select>{ev.type==='CUSTOM'&&<input value={ev.custom} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,custom:e.target.value}:x))} placeholder='CUSTOM EVENT'/>}<input type='date' value={ev.date} onChange={(e)=>update('upcomingEvents',active.upcomingEvents.map((x,idx)=>idx===i?{...x,date:e.target.value}:x))}/></div>)}</section>
      <section className="igt-panel"><h3>PAYMENT</h3><input placeholder='SCHEDULE' value={active.paymentSchedule} onChange={(e)=>update('paymentSchedule',e.target.value)} /><input type='date' value={active.paymentDate} onChange={(e)=>update('paymentDate',e.target.value)} /><input placeholder='NOTES' value={active.paymentNotes} onChange={(e)=>update('paymentNotes',e.target.value)} /></section>
      <section className="igt-panel"><h3>THICC THOUGHTS</h3><textarea className='thoughts' value={active.thoughts} onChange={(e)=>update('thoughts',e.target.value)} /></section>
      <section className="igt-panel"><h3>MYFITFOODS CHECK-IN</h3><input placeholder='MEALS PER WEEK' value={active.myfitMeals} onChange={(e)=>update('myfitMeals',e.target.value)} /><label><input type='checkbox' checked={active.myfitVerified} onChange={(e)=>update('myfitVerified',e.target.checked)} /> VERIFIED WITH ANTHONY</label><textarea value={active.myfitNotes} onChange={(e)=>update('myfitNotes',e.target.value)} /></section>
      <section className="igt-panel full"><h3>CELEBRATION MOMENTS</h3><div className='cele'>{active.celebration.map((img,i)=><label key={i} className='slot'>{img?<img src={img} alt=''/>:`${i+1}`}<input type='file' accept='image/*' onChange={onUpload(String(i))}/></label>)}</div></section><section className="igt-panel"><h3>DELETE PAGE</h3><button className='delete' onClick={()=>{ if(!confirm('DELETE CURRENT CLIENT FILE?')) return; const next=clients.filter(c=>c.id!==active.id); persist(next,'delete-client'); setActiveId(next[0]?.id||''); }}>DELETE PAGE</button></section>
    </main>
  </div></section>;
}
