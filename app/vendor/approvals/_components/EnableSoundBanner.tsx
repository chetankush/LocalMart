'use client';

import { useState } from 'react';
import { useApprovals } from '../../_approvals/ApprovalsPollerContext';

export function EnableSoundBanner() {
  const { audioUnlocked, unlockAudio } = useApprovals();
  const [dismissed, setDismissed] = useState(false);

  if (audioUnlocked || dismissed) return null;

  const handleEnable = () => {
    // Browser autoplay policies require a user gesture before audio.play()
    // will succeed. Play a silent test beep here so subsequent chimes work.
    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => undefined);
    } catch {
      /* noop */
    }
    unlockAudio();
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span>🔔</span>
        <span className="flex-1">
          Tap to enable alert sound on this device.
        </span>
        <button
          type="button"
          onClick={handleEnable}
          className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
        >
          Enable
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="px-2 text-amber-700 hover:text-amber-900"
        >
          ×
        </button>
      </div>
    </div>
  );
}
