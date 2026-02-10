export type RulesetId = "A" | "B" | "C";

export interface FieldRules {
  email: {
    required: boolean;
    noDomains?: string[];
  };
  amount: {
    required: boolean;
    min: number;
    max: number;
    integer: boolean;
    even?: boolean;
  };
  username: {
    required: boolean;
    minLength: number;
    maxLength: number;
    noNumbers?: boolean;
  };
  agree: {
    required: boolean;
  };
}

export interface Ruleset {
  id: RulesetId;
  label: string;
  description: string;
  rules: FieldRules;
}

// What the form holds
export interface FormValues {
  email: string;
  amount: string;
  username: string;
  agree: boolean;
}

// Shape of errors coming back from Express
export interface ServerFieldErrors {
  email?: string;
  amount?: string;
  username?: string;
  agree?: string;
}

export type ServerResponse =
  | { ok: true }
  | { ok: false; type: "field"; errors: ServerFieldErrors }
  | { ok: false; type: "generic"; message: string };