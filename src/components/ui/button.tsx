import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-petrol text-ivory hover:bg-petrol-2 shadow-sm",
  accent: "bg-amber text-ink hover:bg-[#d4973c] shadow-sm",
  secondary: "bg-paper text-ink border border-line hover:border-steel/40 hover:bg-white",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-ivory/10 text-ivory border border-ivory/20 hover:bg-ivory/15",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-11 px-5 text-[15px] rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({ variant, size, className = "", ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant, size, className = "", children, ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return <Link className={buttonClass(variant, size, className)} {...rest}>{children}</Link>;
}
