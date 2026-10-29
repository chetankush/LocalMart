"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt: Date;
  className?: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function CountdownTimer({ endsAt, className = "" }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, endsAt.getTime() - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <span
      role="timer"
      aria-live="off"
      className={`inline-flex items-center gap-1 font-mono tabular-nums text-xs sm:text-sm font-semibold ${className}`}
    >
      <span className="bg-laal text-white rounded px-1.5 py-0.5">{pad(hours)}</span>
      <span className="text-laal">:</span>
      <span className="bg-laal text-white rounded px-1.5 py-0.5">{pad(minutes)}</span>
      <span className="text-laal">:</span>
      <span className="bg-laal text-white rounded px-1.5 py-0.5">{pad(seconds)}</span>
    </span>
  );
}
