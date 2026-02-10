import { AlertCircle, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrorProps {
  clientError?: string;
  serverError?: string;
}

export function FieldError({ clientError, serverError }: FieldErrorProps) {
  if (!clientError && !serverError) return null;

  // Server error takes display priority (it's the stricter truth)
  if (serverError) {
    return (
      <p className={cn(
        "flex items-start gap-1.5 text-xs mt-1.5 font-mono",
        "text-red-500"
      )}>
        <ServerCrash className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          <span className="font-bold uppercase tracking-wide text-[10px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded mr-1.5">
            server
          </span>
          {serverError}
        </span>
      </p>
    );
  }

  return (
    <p className={cn(
      "flex items-start gap-1.5 text-xs mt-1.5 font-mono",
      "text-orange-500"
    )}>
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        <span className="font-bold uppercase tracking-wide text-[10px] bg-orange-500/10 text-orange-500 px-1 py-0.5 rounded mr-1.5">
          client
        </span>
        {clientError}
      </span>
    </p>
  );
}