'use client';

import { useState } from 'react';
import { Volume2, X } from 'lucide-react';
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
    <div className="mb-4 rounded-2xl bg-warn-soft p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-warn">
          <Volume2 className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-[15px] leading-snug">
          <span className="block font-semibold text-label">Turn on order sound</span>
          <span className="block text-label-2">So you never miss a new order · आवाज़ चालू करें</span>
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Not now"
          className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-label-3 hover:text-label cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={handleEnable}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-label text-[15px] font-semibold text-white active:scale-[0.98] cursor-pointer"
      >
        <Volume2 className="h-[18px] w-[18px]" aria-hidden />
        Turn on sound
      </button>
    </div>
  );
}
