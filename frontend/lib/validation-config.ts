import { RULESETS } from "./schemas";
import type { Ruleset } from "@/types/validation";

export const RULESET_INTERVAL_MS = 30_000;

// In a real app this would be:
//   const res = await fetch('/api/validation-config')
//   return res.json()
// For now, rotates on a timer client-side
export function getRulesetByIndex(index: number): Ruleset {
  return RULESETS[index % RULESETS.length];
}