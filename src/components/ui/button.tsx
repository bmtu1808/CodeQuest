import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "blue" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white border-brand-dark hover:brightness-105",
  blue: "bg-sky text-white border-sky-dark hover:brightness-105",
  danger: "bg-danger text-white border-danger-dark hover:brightness-105",
  secondary: "bg-surface text-sky border-line border-2 border-b-4 hover:bg-surface-2",
  outline: "bg-surface text-fg border-line border-2 border-b-4 hover:bg-surface-2",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 !border-b-0 active:!translate-y-0",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-2xl border-b-4 font-extrabold uppercase tracking-wide",
    "transition active:translate-y-[3px] active:border-b-[1px]",
    "disabled:pointer-events-none disabled:border-line disabled:bg-surface-2 disabled:text-muted",
    variants[variant],
    sizes[size],
    className,
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };
export function Button({ variant, size, className, type = "button", ...props }: BtnProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };
export function ButtonLink({ variant, size, className, ...props }: LinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
