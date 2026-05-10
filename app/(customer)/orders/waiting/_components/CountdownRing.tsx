'use client';
import { useEffect, useState } from 'react';

interface Props {
  startedAt: Date;
  durationMs: number;
  size?: number;
  strokeWidth?: number;
}

export function CountdownRing({
  startedAt,
  durationMs,
  size = 180,
  strokeWidth = 12,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAt.getTime());
  const remaining = Math.max(0, durationMs - elapsed);
  const progress = Math.min(1, elapsed / durationMs);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * progress;

  const mm = Math.floor(remaining / 60000).toString().padStart(2, '0');
  const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');

  const hue = 30 - progress * 30;
  const color = `hsl(${hue}, 90%, 55%)`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: size / 5, fontWeight: 700, color }}>
          {mm}:{ss}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
          remaining
        </div>
      </div>
    </div>
  );
}
