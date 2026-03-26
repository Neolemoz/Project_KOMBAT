import { cn } from "../../utils/cn"

export function Panel({ title, children, className, bodyClassName }) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md",
        className
      )}
    >
      {title != null && title !== "" && (
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {title}
          </h2>
        </div>
      )}
      <div className={cn("min-h-0 flex-1 p-4 text-white", bodyClassName)}>{children}</div>
    </section>
  )
}
