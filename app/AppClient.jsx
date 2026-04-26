'use client';

import { useEffect, useRef } from 'react';

export default function AppClient() {
  const rootRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    import('../src/main.js').then((mod) => {
      if (mounted && rootRef.current) mod.mountApp(rootRef.current);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <div id="app" ref={rootRef} />;
}
