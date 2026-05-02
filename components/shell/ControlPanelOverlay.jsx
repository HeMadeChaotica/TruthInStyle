'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function ControlPanelOverlay() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="wand" onClick={() => setOpen(!open)}>☰</button>
      {open && (
        <aside className="control-panel-overlay">
          <nav>
            <Link href="/thicc-fitt">THICC.FITT</Link>
            <Link href="/its-getting-thicc">ITS.GETTING.THICC</Link>
            <Link href="/da-eater">DA.EATER</Link>
            <Link href="/remember-me">REMEMBER.ME</Link>
            <Link href="/the-assurer">THE.ASSURER</Link>
            <Link href="/the-summation">SUMMATION</Link>
            <Link href="/hopewood">HOPEWOOD</Link>
            <Link href="/525600">525600</Link>
            <Link href="/clock-it">CLOCK.IT</Link>
          </nav>
        </aside>
      )}
    </>
  );
}
