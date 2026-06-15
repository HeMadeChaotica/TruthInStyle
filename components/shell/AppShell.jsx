'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  return (
    <div style={{ height: '100%' }}>
      {children}
      <ControlPanelOverlay
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
      />
    </div>
  );
}
