'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ControlPanelOverlay from './ControlPanelOverlay';

const ROUTE_BY_KEY = {
  home: '/home',
  'the-summation': '/the-summation',
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
    return window.localStorage.getItem('completed_summation_sketch');
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('so-let-it-be-done', { detail: payload ?? null }));
    }
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
