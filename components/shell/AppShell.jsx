'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ControlPanelOverlay from './ControlPanelOverlay';
import CloudStateBridge from './CloudStateBridge';
import { flushAllPendingSaves } from '../../lib/state/autosaveRegistry';

const ROUTE_BY_KEY = {
  entrance: '/',
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
  const [exitWarning, setExitWarning] = useState(false);
  const [exitStatus, setExitStatus] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const isOpening = pathname === '/';

  const exitToEntrance = async ({ force = false } = {}) => {
    setExitWarning(false);
    if (!force) {
      setExitStatus('SAVING BEFORE EXIT...');
      const result = await flushAllPendingSaves();
      if (!result.ok) {
        setExitStatus('SAVE WARNING');
        setExitWarning(true);
        return;
      }
    }
    router.push('/');
    setIsOpen(false);
    setExitStatus('');
  };

  const onSelect = (key) => {
    if (key === 'entrance') {
      exitToEntrance();
      return;
    }
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
      <CloudStateBridge />
      {children}
      {!isOpening ? (
        <ControlPanelOverlay
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          onSelect={onSelect}
          exitStatus={exitStatus}
          exitWarning={exitWarning}
          onRetryExit={() => exitToEntrance()}
          onExitAnyway={() => exitToEntrance({ force: true })}
        />
      ) : null}
    </div>
  );
}
