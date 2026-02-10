"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServerCrash } from "lucide-react";

import { buildZodSchema } from "@/lib/schemas";
import { getRulesetByIndex } from "@/lib/validation-config";
import { RulesetTicker } from "./ruleset-ticker";
import { FieldError } from "./field-error";
import type { FormValues, ServerFieldErrors } from "@/types/validation";

export function RegistrationForm() {
  const [rulesetIndex, setRulesetIndex] = useState(0);
  const [serverErrors, setServerErrors] = useState<ServerFieldErrors>({});
  const [serverBanner, setServerBanner] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const ruleset = getRulesetByIndex(rulesetIndex);
  const schema = buildZodSchema(ruleset);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", amount: "", username: "", agree: false },
    mode: "onBlur",  // validate on blur, not on every keystroke
  });

  // When ruleset rotates: keep values, re-run validation against new rules
  const handleRulesetChange = useCallback((newIndex: number) => {
    setRulesetIndex(newIndex);
    setServerErrors({});
    setServerBanner(null);
    // Re-trigger validation on already-touched fields with new schema
    // (trigger() uses the new resolver automatically after re-render)
    setTimeout(() => trigger(), 50);
  }, [trigger]);

  // Clear server error for a field the moment the user edits it
  const clearServerError = (field: keyof ServerFieldErrors) => {
    if (serverErrors[field]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setServerErrors({});
    setServerBanner(null);

    try {
      const res = await fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.ok) {
        setSubmitted(true);
        return;
      }

      if (result.type === "field") {
        setServerErrors(result.errors);  // values untouched, errors overlaid
      } else if (result.type === "generic") {
        setServerBanner(result.message);
      }
    } catch {
      setServerBanner("Could not reach the server. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="font-bold text-green-400 text-lg font-mono mb-1">Submission accepted</h2>
        <p className="text-sm text-white/40 font-mono">Both client and server validation passed.</p>
        <Button
          variant="outline"
          className="mt-5 font-mono text-xs"
          onClick={() => setSubmitted(false)}
        >
          Reset form
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <RulesetTicker
        ruleset={ruleset}
        currentIndex={rulesetIndex}
        onRulesetChange={handleRulesetChange}
      />

      {/* Generic server error banner */}
      {serverBanner && (
        <Alert className="mb-5 border-red-500/30 bg-red-500/5 text-red-400">
          <ServerCrash className="h-4 w-4" />
          <AlertDescription className="font-mono text-xs ml-2">{serverBanner}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Email */}
        <div className="space-y-1.5 text-white">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-white/50">
              Email Address
            </Label>
            {!ruleset.rules.email.required && (
              <span className="text-[10px] text-white/25 font-mono">optional</span>
            )}
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="off"
            {...register("email", {
              onChange: () => clearServerError("email"),
            })}
            className={
              serverErrors.email
                ? "border-red-500 focus-visible:ring-red-500/20 text-white"
                : errors.email
                ? "border-orange-500 focus-visible:ring-orange-500/20 text-white" 
                : "text-white"
            }
          />
          <FieldError
            clientError={errors.email?.message}
            serverError={serverErrors.email}
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="font-mono text-xs uppercase tracking-widest text-white/50">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="your_handle"
            autoComplete="off"
            {...register("username", {
              onChange: () => clearServerError("username"),
            })}
            className={
              serverErrors.username
                ? "border-red-500 focus-visible:ring-red-500/20 text-white"
                : errors.username
                ? "border-orange-500 focus-visible:ring-orange-500/20 text-white"
                : "text-white"
            }
          />
          <FieldError
            clientError={errors.username?.message}
            serverError={serverErrors.username}
          />
          <p className="text-[10px] text-white/25 font-mono">
            Ruleset {ruleset.id}: {ruleset.rules.username.minLength}–{ruleset.rules.username.maxLength} chars
            {ruleset.rules.username.noNumbers ? ", no numbers" : ""}
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="font-mono text-xs uppercase tracking-widest text-white/50">
            Amount
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter a number"
            step={ruleset.rules.amount.integer ? "1" : "any"}
            {...register("amount", {
              onChange: () => clearServerError("amount"),
            })}
            className={
              serverErrors.amount
                ? "border-red-500 focus-visible:ring-red-500/20 text-white"
                : errors.amount
                ? "border-orange-500 focus-visible:ring-orange-500/20 text-white"
                : "text-white"
            }
          />
          <FieldError
            clientError={errors.amount?.message}
            serverError={serverErrors.amount}
          />
          <p className="text-[10px] text-white/25 font-mono">
            Ruleset {ruleset.id}: {ruleset.rules.amount.min}–{ruleset.rules.amount.max}
            {ruleset.rules.amount.integer ? ", integers" : ", decimals OK"}
            {ruleset.rules.amount.even ? ", even only" : ""}
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-mono font-bold tracking-wide"
        >
          {isSubmitting ? "Validating on server…" : "Submit Registration"}
        </Button>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
            <span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" />
            Client error
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
            <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
            Server error
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
            <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
            Dynamic rule
          </div>
        </div>
      </form>
    </div>
  );
}