import { cn } from "../../utils/cn"

const variants = {
  primary:
    "rounded-xl border border-orange-500/70 bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45",
  secondary:
    "rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-45",
  ghost:
    "rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-40",
}

export function Button({ variant = "primary", className, type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={cn(variants[variant] ?? variants.primary, className)}
      {...rest}
    />
  )
}
