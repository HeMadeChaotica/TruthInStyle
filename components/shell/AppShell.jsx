'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSummationSketchSealable, readAssurerDayForSummation, sealSummationVariation } from '../../src/services/summationService';
import ControlPanelOverlay from './ControlPanelOverlay';

const ROUTE_BY_KEY = {
  home: '/the-assurer',
  'its-getting-thicc': '/its-getting-thicc',
  'thicc-fitt': '/thicc-fitt',
  'da-eater': '/da-eater',
  'remember-me': '/remember-me',
  hopewood: '/hopewood',
  '525600': '/525600',
  'the-summation': '/the-summation',
  'clock-it': '/clock-it',
};

const SUMMATION_DRAFT_KEY = 'the_summation_active_draft_v1';

function safeJsonParse(raw, fallback = null) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

export default function AppShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const onSelect = (key) => {
    if (key === 'back') {
      router.back();
      setIsOpen(false);
      return;
    }
    const route = ROUTE_BY_KEY[key];
    if (route) {
      router.push(route);
      setIsOpen(false);
    }
  };

  const onSummate = async (activeDay) => {
    if (typeof window === 'undefined') return;
    const dayPayload = await readAssurerDayForSummation(dateFromKey(activeDay));
    window.localStorage.setItem(SUMMATION_DRAFT_KEY, JSON.stringify({ sourceDate: activeDay, dayPayload, updatedAt: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent('truthinstyle-summation-draft', { detail: { sourceDate: activeDay, dayPayload } }));
    if (window.confirm(`Send ${dayPayload.displayDate} from THE.ASSURER into THE.SUMMATION?`)) router.push('/the-summation');
  };

  const onSoLetItBeDone = async () => {
    if (typeof window === 'undefined') return;
    const storedSketch = window.localStorage.getItem('completed_summation_sketch');
    if (!isSummationSketchSealable(storedSketch)) {
      window.dispatchEvent(new CustomEvent('so-let-it-be-done'));
      return;
    }
    const draft = safeJsonParse(window.localStorage.getItem(SUMMATION_DRAFT_KEY), null);
    const sourceDate = draft?.sourceDate || draft?.dayPayload?.sourceDate;
    const dayPayload = draft?.dayPayload || await readAssurerDayForSummation(dateFromKey(sourceDate));
    const sealed = sealSummationVariation(dayPayload, safeJsonParse(storedSketch, null));
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('so-let-it-be-done'));
    if (sealed) router.push('/hopewood');
  };

  return (
    <div style={{ height: '100%' }}>
      {children}
      <ControlPanelOverlay
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
        onSummate={onSummate}
        onSoLetItBeDone={onSoLetItBeDone}
      />
    </div>
  );
}
