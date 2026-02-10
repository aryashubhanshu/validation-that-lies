export function FieldError({ clientError, serverError }) {
  if (!clientError && !serverError) return null;

  const isServer = !!serverError;
  const message  = serverError ?? clientError;

  return (
    <p className={`flex items-start gap-1.5 text-xs mt-1.5 font-mono ${isServer ? "text-red-400" : "text-orange-400"}`}>
      <span className={`text-[10px] font-bold uppercase tracking-wide px-1 py-0.5 rounded shrink-0 mt-0.5
        ${isServer ? "bg-red-500/15 text-red-400" : "bg-orange-500/15 text-orange-400"}`}>
        {isServer ? "server" : "client"}
      </span>
      {message}
    </p>
  );
}