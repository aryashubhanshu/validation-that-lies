"use client";

import { useState, useEffect, useCallback } from "react";
import { RULESETS, buildSchema } from "@/lib/schemas";
import { FieldError } from "@/components/field-error";

const INTERVAL = 30;

export default function Page() {
  const [rulesetIdx, setRulesetIdx]     = useState(0);
  const [countdown, setCountdown]       = useState(INTERVAL);
  const [toastVisible, setToastVisible] = useState(false);

  // Form state — never wiped on error
  const [values, setValues]         = useState({ email: "", amount: "", username: "", agree: false });
  const [touched, setTouched]       = useState({});
  const [clientErrors, setClErrors] = useState({});
  const [serverErrors, setServErrs] = useState({});
  const [serverBanner, setServBan]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const ruleset = RULESETS[rulesetIdx % RULESETS.length];

  // ── Validate one field against current ruleset 
  const validateField = useCallback((name, val, rs) => {
    const schema = buildSchema(rs);
    const result = schema.shape[name].safeParse(val);
    return result.success ? null : result.error.issues[0].message;
  }, []);

  // ── Ruleset rotation countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRulesetIdx((i) => i + 1);
          setToastVisible(true);
          setServErrs({});
          setServBan(null);
          setTimeout(() => setToastVisible(false), 2500);
          return INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Re-validate touched fields when ruleset changes
  useEffect(() => {
    const errs = {};
    Object.keys(touched).forEach((name) => {
      const err = validateField(name, values[name], ruleset);
      if (err) errs[name] = err;
    });
    setClErrors(errs);
  }, [rulesetIdx]); // eslint-disable-line

  // ── Field change 
  function handleChange(name, val) {
    setValues((v) => ({ ...v, [name]: val }));
    // Clear server error for this field immediately on edit
    if (serverErrors[name]) setServErrs((e) => { const n = { ...e }; delete n[name]; return n; });
    // Live-validate if already touched
    if (touched[name]) {
      const err = validateField(name, val, ruleset);
      setClErrors((e) => ({ ...e, [name]: err ?? undefined }));
    }
  }

  function handleBlur(name) {
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, values[name], ruleset);
    setClErrors((e) => ({ ...e, [name]: err ?? undefined }));
  }

  // ── Submit
  async function handleSubmit(e) {
    e.preventDefault();

    // Touch everything and run full client validation
    setTouched({ email: true, amount: true, username: true, agree: true });
    const schema = buildSchema(ruleset);
    const result = schema.safeParse(values);

    if (!result.success) {
      const errs = {};
      for (const issue of result.error.issues) {
        if (!errs[issue.path[0]]) errs[issue.path[0]] = issue.message;
      }
      setClErrors(errs);
      return; // stop here — don't hit the server
    }

    setClErrors({});
    setServErrs({});
    setServBan(null);
    setSubmitting(true);

    try {
      const res  = await fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
      } else if (data.type === "field") {
        setServErrs(data.errors); // input values untouched
      } else {
        setServBan(data.message);
      }
    } catch {
      setServBan("Could not reach the server. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Input border class 
  function borderClass(name) {
    if (serverErrors[name]) return "border-red-500 focus:ring-red-500/20";
    if (touched[name] && clientErrors[name]) return "border-orange-500 focus:ring-orange-500/20";
    if (touched[name] && values[name]) return "border-emerald-600/50";
    return "border-white/10";
  }

  // ── Success screen 
  if (success) {
    return (
      <main className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-green-400 font-mono font-bold text-xl mb-1">Accepted</h2>
          <p className="text-white/40 font-mono text-sm mb-6">Client and server both passed.</p>
          <button
            onClick={() => { setSuccess(false); setValues({ email: "", amount: "", username: "", agree: false }); setTouched({}); }}
            className="text-xs font-mono border border-white/10 text-white/40 px-4 py-2 rounded hover:border-white/20 transition-colors"
          >
            Reset
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">

      {/* Toast */}
      {toastVisible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black text-xs font-bold font-mono px-5 py-2 rounded-full shadow-xl">
          Rules changed → Ruleset {ruleset.id}
        </div>
      )}

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight mb-2">
            Validation That Lies
          </h1>
        </div>

        {/* Ruleset ticker */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-sm">⚡</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold font-mono">
                  Active Ruleset
                </span>
                <span className="text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded font-mono">
                  {ruleset.id}
                </span>
              </div>
              <p className="text-xs text-white/60 font-mono">{ruleset.description}</p>
              <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / INTERVAL) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-amber-400 font-mono text-xs font-semibold">{countdown}s</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#161618]">
          <div className="p-6">
            {/* Generic server banner */}
            {serverBanner && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/5 p-3 mb-5">
                <span className="text-red-400 text-sm shrink-0">⚠</span>
                <p className="text-xs text-red-400 font-mono">{serverBanner}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-white/40 font-mono">
                    Email
                  </label>
                  {!ruleset.rules.email.required && (
                    <span className="text-[10px] text-white/20 font-mono">optional</span>
                  )}
                </div>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@company.com"
                  autoComplete="off"
                  className={`w-full bg-white/[0.03] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-white/20 border outline-none focus:ring-2 transition-colors ${borderClass("email")}`}
                />
                <FieldError clientError={clientErrors.email} serverError={serverErrors.email} />
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/40 font-mono mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={values.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={() => handleBlur("username")}
                  placeholder="your_handle"
                  autoComplete="off"
                  className={`w-full bg-white/[0.03] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-white/20 border outline-none focus:ring-2 transition-colors ${borderClass("username")}`}
                />
                <FieldError clientError={clientErrors.username} serverError={serverErrors.username} />
                <p className="text-[10px] text-white/20 font-mono mt-1">
                  ⚡ {ruleset.rules.username.min}–{ruleset.rules.username.max} chars
                  {ruleset.rules.username.noNumbers ? " · no numbers" : ""}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/40 font-mono mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  value={values.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  onBlur={() => handleBlur("amount")}
                  placeholder="Enter a number"
                  step={ruleset.rules.amount.integer ? "1" : "any"}
                  className={`w-full bg-white/[0.03] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-white/20 border outline-none focus:ring-2 transition-colors ${borderClass("amount")}`}
                />
                <FieldError clientError={clientErrors.amount} serverError={serverErrors.amount} />
                <p className="text-[10px] text-white/20 font-mono mt-1">
                  ⚡ {ruleset.rules.amount.min}–{ruleset.rules.amount.max}
                  {ruleset.rules.amount.integer ? " · integers" : " · decimals OK"}
                  {ruleset.rules.amount.even ? " · even only" : ""}
                </p>
              </div>

              {/* Agree */}
              <div>
                <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors
                  ${touched.agree && clientErrors.agree ? "border-orange-500/40 bg-orange-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <input
                    type="checkbox"
                    checked={values.agree}
                    onChange={(e) => { handleChange("agree", e.target.checked); handleBlur("agree"); }}
                    className="mt-0.5 accent-violet-500 cursor-pointer"
                  />
                  <span className="text-xs text-white/40 font-mono leading-relaxed">
                    I agree to the{" "}
                    <span className="text-violet-400">Terms of Service</span> and{" "}
                    <span className="text-violet-400">Privacy Policy</span>
                    {!ruleset.rules.agree.required ? " (optional this session)" : ""}
                  </span>
                </label>
                <FieldError clientError={clientErrors.agree} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Validating on server…</>
                  : "Submit Registration"}
              </button>

              {/* Legend */}
              <div className="flex justify-center gap-5 pt-1">
                {[
                  { color: "bg-orange-500", label: "Client error" },
                  { color: "bg-red-500",    label: "Server error" },
                  { color: "bg-amber-400",  label: "Dynamic rule" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/25 font-mono">
                    <span className={`w-2 h-2 rounded-sm ${color}`} />
                    {label}
                  </div>
                ))}
              </div>

            </form>
          </div>
        </div>
      </div>
    </main>
  );
}