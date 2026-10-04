'use client';

import { useEffect, useState } from 'react';

/** Live date and time for the header; empty until mounted to avoid a hydration mismatch. */
export default function Clock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <span className="clock">&nbsp;</span>;
  return (
    <span className="clock">
      {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} &middot;{' '}
      {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
