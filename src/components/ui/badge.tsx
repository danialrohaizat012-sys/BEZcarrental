import type { ReactNode } from "react";

type Tone = "good" | "warn" | "bad" | "neutral" | "petrol" | "amber";
const tones: Record<Tone, string> = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-sand text-steel",
  petrol: "bg-petrol-soft text-petrol",
  amber: "bg-amber-soft text-amber-2",
};

export function Badge({ tone = "neutral", dot = true, children, className = "" }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Small uppercase tag marking demo/sample content. */
export function SampleTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-amber/60 bg-amber-soft/60 px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-amber-2">
      {children}
    </span>
  );
}
