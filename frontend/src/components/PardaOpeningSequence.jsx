import React, { useState, useEffect } from 'react';
import { Lock, Check } from 'lucide-react';

export default function PardaOpeningSequence({ onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
    }
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = 50; // update every 50ms
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 50;
        if (next >= 4200) {
          clearInterval(timer);
          onComplete();
          return 4200;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [reducedMotion, onComplete]);

  // Compute active caption & progress percentage
  // 0ms - 1300ms: "Your record stays private."
  // 1300ms - 2700ms: "Only a proof travels."
  // 2700ms - 4200ms: "Claim checked."
  let caption = "Your record stays private.";
  let progress = 0;

  if (reducedMotion) {
    caption = "Claim checked.";
    progress = 1;
  } else {
    if (elapsed < 1300) {
      caption = "Your record stays private.";
      progress = 0;
    } else if (elapsed < 2700) {
      caption = "Only a proof travels.";
      // slide dot from 0 to 1 during this phase
      progress = (elapsed - 1300) / 1400;
    } else {
      caption = "Claim checked.";
      progress = 1;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Parda Introduction"
      className="fixed inset-0 z-50 bg-[#0B1713] text-[#F3EFE5] flex flex-col justify-between p-6 sm:p-12 font-sans select-none"
    >
      {/* Top Bar with brand and Skip button */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-[#B99561]" />
          <span className="text-sm font-medium tracking-wide text-[#F3EFE5]">Parda</span>
        </div>

        <button
          onClick={onComplete}
          className="text-xs text-[#AEB8AA] hover:text-[#F3EFE5] px-3 py-1.5 rounded border border-[#9DAF9D]/20 hover:border-[#B99561]/50 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Center Minimalist Scene */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center my-auto py-12">
        {/* The Track with Ivory Card, Moving Brass Dot, and Target Check */}
        <div className="w-full flex items-center justify-between relative px-4 sm:px-12">
          
          {/* Left: Small Ivory Paper Card with Lock */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-18 sm:w-16 sm:h-20 bg-[#F3EFE5] rounded-sm shadow-md flex flex-col items-center justify-center p-2 border border-[#AEB8AA]/30">
              <div className="w-6 h-1 bg-[#AEB8AA]/40 rounded-full mb-3" />
              <Lock className="w-5 h-5 text-[#0B1713]" strokeWidth={2} />
              <div className="w-8 h-1 bg-[#AEB8AA]/30 rounded-full mt-3" />
            </div>
          </div>

          {/* Center: Thin Line with Sliding Brass Dot */}
          <div className="flex-1 h-px bg-[#9DAF9D]/25 relative mx-4 sm:mx-8">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#B99561] shadow-[0_0_10px_rgba(185,149,97,0.7)] transition-all ease-linear"
              style={{
                left: `${Math.min(100, Math.max(0, progress * 100))}%`,
                transform: 'translate(-50%, -50%)',
                opacity: progress > 0 ? 1 : 0.4,
              }}
            />
          </div>

          {/* Right: Target Ring where Check Appears */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center ${
              progress >= 0.95
                ? 'border-[#B99561] bg-[#12231C]'
                : 'border-[#9DAF9D]/20 bg-[#0B1713]'
            }`}>
              {progress >= 0.95 ? (
                <Check className="w-5 h-5 text-[#B99561]" strokeWidth={2.5} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#9DAF9D]/30" />
              )}
            </div>
          </div>

        </div>

        {/* Dynamic Caption */}
        <div className="mt-14 text-center h-8 flex items-center justify-center">
          <p className="text-base sm:text-lg text-[#F3EFE5] font-normal transition-opacity duration-300">
            {caption}
          </p>
        </div>

        {/* Reduced Motion Action */}
        {reducedMotion && (
          <button
            onClick={onComplete}
            className="mt-6 px-5 py-2 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors"
          >
            Enter Parda
          </button>
        )}
      </div>

      {/* Bottom honest disclaimer */}
      <div className="w-full max-w-4xl mx-auto text-center">
        <p className="text-[11px] text-[#AEB8AA]/70">
          Visual demonstration · Not real medical or blockchain activity
        </p>
      </div>
    </div>
  );
}
