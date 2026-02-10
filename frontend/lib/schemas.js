import { z } from "zod";

export const RULESETS = [
  {
    id: "A",
    label: "Ruleset A — Standard",
    description: "Email required · amount 1–1000 · username min 3 chars",
    rules: { email: { required: true }, amount: { min: 1, max: 1000, integer: true }, username: { min: 3, max: 20 }, agree: { required: true } },
  },
  {
    id: "B",
    label: "Ruleset B — Strict",
    description: "Work email only · amount 10–500 even · username min 5 no numbers",
    rules: { email: { required: true, noDomains: ["gmail.com", "yahoo.com", "hotmail.com"] }, amount: { min: 10, max: 500, integer: true, even: true }, username: { min: 5, max: 15, noNumbers: true }, agree: { required: true } },
  },
  {
    id: "C",
    label: "Ruleset C — Relaxed",
    description: "Email optional · amount 0–9999 · username min 2 chars",
    rules: { email: { required: false }, amount: { min: 0, max: 9999, integer: false }, username: { min: 2, max: 30 }, agree: { required: false } },
  },
];

export function buildSchema(ruleset) {
  const { rules } = ruleset;

  const email = rules.email.required
    ? z.string().min(1, "Email is required.").email("Enter a valid email.")
    : z.string().email("Enter a valid email.").or(z.literal(""));

  const finalEmail = rules.email.noDomains
    ? email.refine(
        (val) => { if (!val) return true; return !rules.email.noDomains.includes(val.split("@")[1]); },
        { message: `Personal domains (${rules.email.noDomains.join(", ")}) not accepted.` }
      )
    : email;

  const amount = z
    .string()
    .min(1, "Amount is required.")
    .refine((val) => !isNaN(Number(val)), { message: "Must be a valid number." })
    .refine((val) => Number(val) >= rules.amount.min, { message: `Minimum is ${rules.amount.min}.` })
    .refine((val) => Number(val) <= rules.amount.max, { message: `Maximum is ${rules.amount.max}.` })
    .refine((val) => !rules.amount.integer || Number.isInteger(Number(val)), { message: "Must be a whole number." })
    .refine((val) => !rules.amount.even || Number(val) % 2 === 0, { message: "Must be an even number." });

  const username = z
    .string()
    .min(rules.username.min, `At least ${rules.username.min} characters.`)
    .max(rules.username.max, `No more than ${rules.username.max} characters.`)
    .refine((val) => !rules.username.noNumbers || !/\d/.test(val), { message: "No numbers allowed in username." });

  const agree = rules.agree.required
    ? z.boolean().refine((v) => v === true, { message: "You must accept the terms." })
    : z.boolean();

  return z.object({ email: finalEmail, amount, username, agree });
}