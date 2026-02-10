import { z } from "zod";
import type { Ruleset } from "@/types/validation";

// ─── The three rulesets ───────────────────────────────────────────────────────

export const RULESETS: Ruleset[] = [
  {
    id: "A",
    label: "Ruleset A — Standard",
    description: "Email required, amount 1–1000, username min 3 chars",
    rules: {
      email:    { required: true },
      amount:   { required: true, min: 1,  max: 1000, integer: true },
      username: { required: true, minLength: 3, maxLength: 20 },
      agree:    { required: true },
    },
  },
  {
    id: "B",
    label: "Ruleset B — Strict",
    description: "Work email only, amount 10–500 even, username min 5 no numbers",
    rules: {
      email:    { required: true,  noDomains: ["gmail.com", "yahoo.com", "hotmail.com"] },
      amount:   { required: true,  min: 10, max: 500,  integer: true, even: true },
      username: { required: true,  minLength: 5, maxLength: 15, noNumbers: true },
      agree:    { required: true },
    },
  },
  {
    id: "C",
    label: "Ruleset C — Relaxed",
    description: "Email optional, any amount up to 9999, username min 2 chars",
    rules: {
      email:    { required: false },
      amount:   { required: true, min: 0, max: 9999, integer: false },
      username: { required: true, minLength: 2, maxLength: 30 },
      agree:    { required: false },
    },
  },
];

// ─── Build a Zod schema dynamically from a Ruleset ───────────────────────────

export function buildZodSchema(ruleset: Ruleset) {
  const { rules } = ruleset;

  const emailSchema = rules.email.required
    ? z.string().min(1, "Email is required.").email("Enter a valid email address.")
    : z.string().email("Enter a valid email address.").or(z.literal(""));

  const finalEmail = rules.email.noDomains
    ? (emailSchema as z.ZodString).refine(
        (val) => {
          if (!val) return true;
          const domain = val.split("@")[1];
          return !rules.email.noDomains!.includes(domain);
        },
        {
          message: `Personal domains (${rules.email.noDomains!.join(", ")}) are not accepted.`,
        }
      )
    : emailSchema;

  const amountSchema = z
    .string()
    .min(1, "Amount is required.")
    .refine((val) => !isNaN(Number(val)), { message: "Must be a valid number." })
    .refine((val) => Number(val) >= rules.amount.min, {
      message: `Must be at least ${rules.amount.min}.`,
    })
    .refine((val) => Number(val) <= rules.amount.max, {
      message: `Must be no more than ${rules.amount.max}.`,
    })
    .refine((val) => !rules.amount.integer || Number.isInteger(Number(val)), {
      message: "Must be a whole number.",
    })
    .refine((val) => !rules.amount.even || Number(val) % 2 === 0, {
      message: "Must be an even number (current ruleset).",
    });

  const usernameSchema = z
    .string()
    .min(rules.username.minLength, `Must be at least ${rules.username.minLength} characters.`)
    .max(rules.username.maxLength, `Must be no more than ${rules.username.maxLength} characters.`)
    .refine((val) => !rules.username.noNumbers || !/\d/.test(val), {
      message: "Username cannot contain numbers (current ruleset).",
    });

  const agreeSchema = rules.agree.required
    ? z.boolean().refine((v) => v === true, { message: "You must accept the terms." })
    : z.boolean();

  return z.object({
    email:    finalEmail,
    amount:   amountSchema,
    username: usernameSchema,
    agree:    agreeSchema,
  });
}