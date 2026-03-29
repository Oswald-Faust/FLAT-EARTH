'use client';

import { useState, useEffect } from 'react';
import { formatTimeLeft } from '@/lib/utils';

interface LiveTimerProps {
  endsAt: Date | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function LiveTimer({ endsAt, className, style }: LiveTimerProps) {
  const [time, setTime] = useState(formatTimeLeft(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTimeLeft(endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <span
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', ...style }}
    >
      {time}
    </span>
  );
}
