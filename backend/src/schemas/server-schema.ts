import { z } from "zod";

// ─── Banned values the client has NO idea about ───────────────────────────────

const BANNED_EMAIL_DOMAINS = ["test.com", "mailinator.com", "throwaway.email"];

const BANNED_USERNAMES = [
  "admin", "root", "administrator", "superuser",
  "system", "moderator", "support", "help",
];

// ─── The server schema ────────────────────────────────────────────────────────
// Client passes its own Zod schema. Server has this one.
// They are NOT the same. That's the point.

export const serverSubmitSchema = z.object({

  email: z
    .string()
    .min(1, "Email is required.")
    .email("Must be a valid email address.")
    .refine(
      (val) => {
        const domain = val.split("@")[1];
        return !BANNED_EMAIL_DOMAINS.includes(domain);
      },
      { message: "This email domain is not permitted on our platform." }
    ),

  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine((val) => !isNaN(Number(val)), { message: "Must be a valid number." })
    .refine((val) => Number(val) > 0, { message: "Amount must be greater than 0." })
    // The rule the client will NEVER warn about: multiples of 7 are reserved
    .refine(
      (val) => Number(val) % 7 !== 0,
      { message: "This value is reserved by the system. Try a nearby number." }
    )
    // Server also enforces a hard ceiling the client doesn't know about
    .refine(
      (val) => Number(val) <= 5000,
      { message: "Amount exceeds the server-side maximum of 5000." }
    ),

  username: z
    .string()
    .min(1, "Username is required.")
    .refine(
      (val) => !BANNED_USERNAMES.includes(val.toLowerCase()),
      { message: "This username is already taken. Please choose another." }
    )
    // Server bans usernames that are ALL numbers — client doesn't check this
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Username cannot be entirely numeric." }
    )
    // Server also bans leading/trailing underscores
    .refine(
      (val) => !/^_|_$/.test(val),
      { message: "Username cannot start or end with an underscore." }
    ),

  agree: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the terms to continue." }),

});

export type ServerSubmitInput = z.infer<typeof serverSubmitSchema>;