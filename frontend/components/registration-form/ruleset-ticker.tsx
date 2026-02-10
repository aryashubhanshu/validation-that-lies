"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import type { Ruleset } from "@/types/validation";
import { RULESET_INTERVAL_MS } from "@/lib/validation-config";

interface RulesetTickerProps {
  ruleset: Ruleset;
  onRulesetChange: (newIndex: number) => void;
  currentIndex: number;
}

export function RulesetTicker({ ruleset, onRulesetChange, currentIndex }: RulesetTickerProps) {
  const [timeLeft, setTimeLeft] = useState(RULESET_INTERVAL_MS / 1000);
  const [toastVisible, setToastVisible] = useState(false);
  const [prevRulesetId, setPrevRulesetId] = useState(ruleset.id);

  if (ruleset.id !== prevRulesetId) {
    setPrevRulesetId(ruleset.id);
    setTimeLeft(RULESET_INTERVAL_MS / 1000);
  }

  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onRulesetChange(currentIndex + 1);
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 2500);
          return RULESET_INTERVAL_MS / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [currentIndex, onRulesetChange]);

  const fillPct = (timeLeft / (RULESET_INTERVAL_MS / 1000)) * 100;

  return (
    <>
      {/* Toast */}
      {toastVisible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black text-xs font-bold font-mono px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-top-2 duration-300">
          Validation rules just changed to Ruleset {ruleset.id}
        </div>
      )}

      {/* Ticker strip */}
      <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                Active Ruleset
              </span>
              <span className="text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded">
                {ruleset.id}
              </span>
            </div>
            <p className="text-xs text-white/80 font-mono font-medium mb-0.5">{ruleset.label}</p>
            <p className="text-[11px] text-white/40 font-mono">{ruleset.description}</p>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-amber-400 font-mono font-semibold shrink-0">{timeLeft}s</span>
        </div>
      </div>
    </>
  );
}