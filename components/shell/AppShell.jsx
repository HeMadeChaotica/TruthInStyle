'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isSummationSketchSealable } from '../../src/services/summationService';
import ControlPanelOverlay from './ControlPanelOverlay';

const ROUTE_BY_KEY = {
  home: '/home',
  'the-summation': '/the-summation',
  'its-getting-thicc': '/its-getting-thicc',
  'thicc-fitt': '/thicc-fitt',
  'da-eater': '/da-eater',
  'remember-me': '/remember-me',
  hopewood: '/hopewood',
  '525600': '/525600',
  'clock-it': '/clock-it',
  summate: '/summate'
};

export default function AppShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const completedSummationSketch = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const storedSketch = window.localStorage.getItem('completed_summation_sketch');
    return isSummationSketchSealable(storedSketch) ? storedSketch : null;
  }, [pathname]);

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

  const onSoLetItBeDone = (payload) => {
    if (typeof window === 'undefined') return;

    const storedSketch = window.localStorage.getItem('completed_summation_sketch');
    const sealPayload = isSummationSketchSealable(payload) ? payload : storedSketch;
    if (!isSummationSketchSealable(sealPayload)) {
      window.localStorage.removeItem('completed_summation_sketch');
      console.warn('THE.SUMMATION seal blocked: completed_summation_sketch is missing or has incomplete Penny answers.');
      setIsOpen(false);
      return;
    }

    window.dispatchEvent(new CustomEvent('so-let-it-be-done', { detail: sealPayload }));
    router.push('/hopewood');
    setIsOpen(false);
  };

  return (
    <div
      style={{ height: '100%' }}
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchMove={(e) => {
        const currentX = e.touches[0]?.clientX ?? 0;
        if (touchStartX !== null && touchStartX <= 28 && currentX - touchStartX > 36) setIsOpen(true);
      }}
      onTouchEnd={() => setTouchStartX(null)}
    >
      {children}
      <ControlPanelOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
        onSoLetItBeDone={onSoLetItBeDone}
        completedSummationSketch={completedSummationSketch}
      />
    </div>
  );
}
