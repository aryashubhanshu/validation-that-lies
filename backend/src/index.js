import express from "express";
import { z } from "zod";
import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ── Hidden server rules (client has NO idea about these) ──────────────────────

const BANNED_DOMAINS   = ["test.com", "mailinator.com"];
const BANNED_USERNAMES = ["admin", "root", "administrator", "superuser", "system"];

const serverSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Must be a valid email.")
    .refine(
      (val) => !BANNED_DOMAINS.includes(val.split("@")[1]),
      { message: "This email domain is not permitted on our platform." }
    ),

  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine((val) => !isNaN(Number(val)), { message: "Must be a valid number." })
    .refine((val) => Number(val) % 7 !== 0, {
      message: "This value is reserved by the system. Try a nearby number.",
    })
    .refine((val) => Number(val) <= 5000, {
      message: "Amount exceeds the server maximum of 5000.",
    }),

  username: z
    .string()
    .min(1, "Username is required.")
    .refine((val) => !BANNED_USERNAMES.includes(val.toLowerCase()), {
      message: "This username is already taken.",
    })
    .refine((val) => !/^\d+$/.test(val), {
      message: "Username cannot be entirely numeric.",
    }),

  agree: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the terms." }),
});

// ── POST /api/submit ──────────────────────────────────────────────────────────

app.post("/api/submit", (req, res) => {
  const result = serverSchema.safeParse(req.body);

  if (!result.success) {
    // One error per field, first one wins
    const errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (!errors[field]) errors[field] = issue.message;
    }
    return res.status(422).json({ ok: false, type: "field", errors });
  }

  // 15% random failure to show generic server error handling
  if (Math.random() < 0.15) {
    return res.status(503).json({
      ok: false,
      type: "generic",
      message: "Server temporarily overloaded. Please try again.",
    });
  }

  console.log("[accepted]", result.data);
  res.json({ ok: true });
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
  console.log("Hidden rules: @test.com banned, multiples of 7 reserved, admin taken");
});