import { cn } from "../../utils/cn"

const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/30 focus:ring-1 focus:ring-white/20"

export function TextField({ label, id, className, ...rest }) {
  const fieldId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined)
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-xs font-medium text-white/80">
          {label}
        </label>
      ) : null}
      <input id={fieldId} className={inputCls} {...rest} />
    </div>
  )
}
