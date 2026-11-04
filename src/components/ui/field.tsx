import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-paper px-3 text-[15px] text-ink shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] transition-colors placeholder:text-mist hover:border-steel/40 focus:border-petrol focus:outline-none focus:ring-2 focus:ring-petrol/20 aria-[invalid=true]:border-bad aria-[invalid=true]:ring-bad/15";

export function Field({ label, htmlFor, hint, error, children, className = "" }: {
  label: ReactNode; htmlFor: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-steel">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-[13px] font-medium text-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-mist">{hint}</p>
      ) : null}
    </div>
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} appearance-none pr-9 ${props.className ?? ""}`} />
      <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
    </div>
  );
}
