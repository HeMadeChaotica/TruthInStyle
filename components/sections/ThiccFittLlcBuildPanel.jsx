'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  THICC_FITT_LLC_BUILD_CATEGORIES,
  THICC_FITT_LLC_BUILD_UPDATED_EVENT,
  addThiccFittLlcWorkEntry,
  buildThiccFittLlcBuildSignal,
  readThiccFittLlcBuildState,
  updateThiccFittLlcMilestone,
} from '../../src/services/thiccFittLlcBuildService';

const dateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const EMPTY_WORK = {
  date: dateKey(),
  category: 'SYSTEMS & OPERATIONS',
  title: '',
  minutes: '',
  status: 'complete',
  notes: '',
};

export default function ThiccFittLlcBuildPanel({ intelligence }) {
  const [state, setState] = useState(() => readThiccFittLlcBuildState());
  const [work, setWork] = useState(EMPTY_WORK);

  useEffect(() => {
    const refresh = () => setState(readThiccFittLlcBuildState());
    window.addEventListener(THICC_FITT_LLC_BUILD_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(THICC_FITT_LLC_BUILD_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const live = useMemo(() => buildThiccFittLlcBuildSignal(new Date()), [state]);

  const submitWork = (event) => {
    event.preventDefault();
    if (!work.title.trim() || Number(work.minutes) <= 0) return;
    const next = addThiccFittLlcWorkEntry(work);
    setState(next);
    setWork({ ...EMPTY_WORK, date: dateKey() });
  };

  const updateMilestone = (id, updates) => {
    setState(updateThiccFittLlcMilestone(id, updates));
  };

  return (
    <div className="annual525600-business">
      <section className="annual525600-business-ledger" aria-label="THICC.FITT LLC live build ledger">
        <header>
          <div><span>LIVE COMPANY BUILD</span><strong>{live.completedMilestones} / {live.totalMilestones} MILESTONES</strong></div>
          <div><span>NEXT REQUIRED ACTION</span><strong>{live.nextRequiredAction || 'SET THE NEXT COMPANY ACTION'}</strong></div>
        </header>

        <div className="annual525600-business-milestones">
          {state.milestones.map((milestone) => (
            <article key={milestone.id} className={`is-${milestone.status}`}>
              <div>
                <span>{milestone.category}</span>
                <strong>{milestone.title}</strong>
                <small>{milestone.targetDate ? `TARGET ${milestone.targetDate}` : 'TARGET DATE OPEN'}</small>
              </div>
              <select value={milestone.status} onChange={(event) => updateMilestone(milestone.id, { status: event.target.value })} aria-label={`${milestone.title} status`}>
                <option value="planned">PLANNED</option>
                <option value="in_progress">IN PROGRESS</option>
                <option value="blocked">BLOCKED</option>
                <option value="complete">COMPLETE</option>
              </select>
              <input type="date" value={milestone.targetDate} onChange={(event) => updateMilestone(milestone.id, { targetDate: event.target.value })} aria-label={`${milestone.title} target date`} />
              <input value={milestone.nextAction} onChange={(event) => updateMilestone(milestone.id, { nextAction: event.target.value })} aria-label={`${milestone.title} next action`} placeholder="NEXT REQUIRED ACTION" />
            </article>
          ))}
        </div>
      </section>

      <section className="annual525600-business-work">
        <form onSubmit={submitWork}>
          <h3>LOG COMPANY-BUILD WORK</h3>
          <div className="annual525600-business-work-grid">
            <input type="date" value={work.date} onChange={(event) => setWork({ ...work, date: event.target.value })} aria-label="Work date" />
            <select value={work.category} onChange={(event) => setWork({ ...work, category: event.target.value })} aria-label="Work category">
              {THICC_FITT_LLC_BUILD_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
            <input value={work.title} onChange={(event) => setWork({ ...work, title: event.target.value })} placeholder="WORK COMPLETED OR IN PROGRESS" aria-label="Work title" />
            <input type="number" min="1" step="1" value={work.minutes} onChange={(event) => setWork({ ...work, minutes: event.target.value })} placeholder="MINUTES" aria-label="Minutes invested" />
            <select value={work.status} onChange={(event) => setWork({ ...work, status: event.target.value })} aria-label="Work status">
              <option value="complete">COMPLETE</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="blocked">BLOCKED</option>
              <option value="planned">PLANNED</option>
            </select>
            <input value={work.notes} onChange={(event) => setWork({ ...work, notes: event.target.value })} placeholder="NOTES OR BLOCKER" aria-label="Work notes" />
          </div>
          <button type="submit">LOG LLC BUILD WORK</button>
        </form>

        <div className="annual525600-business-receipts">
          <div><span>SEALED WORK TIME</span><strong>{Math.round((intelligence.workMinutes || 0) / 60 * 10) / 10} HR</strong></div>
          <div><span>COMPLETED WORK</span><strong>{intelligence.completedWork || 0}</strong></div>
          <div><span>ISSA READINESS</span><strong>{intelligence.school?.completionPercent ?? live.school?.completionPercent ?? 0}%</strong></div>
          <div><span>ACTIVE CLIENTS</span><strong>{intelligence.operations?.activeClients ?? live.operations?.activeClients ?? 0}</strong></div>
          <div><span>OVERDUE</span><strong>{intelligence.overdueMilestones?.length || 0}</strong></div>
          <div><span>BLOCKERS</span><strong>{intelligence.blockingItems?.length || 0}</strong></div>
        </div>
      </section>

      <section className="annual525600-business-trend">
        <h3>MONTHLY COMPANY MOMENTUM</h3>
        {intelligence.monthly?.length ? intelligence.monthly.map((month) => (
          <div key={month.month}><span>{month.month}</span><strong>{Math.round(month.minutes / 60 * 10) / 10} HR</strong><small>{month.completedWork} COMPLETED · {month.sealedDays} SEALED DAYS</small></div>
        )) : <p>COMPANY WORK WILL APPEAR HERE AFTER THE DAY IS SEALED INTO HOPEWOOD.</p>}
      </section>
    </div>
  );
}
