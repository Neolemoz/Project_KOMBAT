import { cn } from "../../utils/cn"

export default function MinionSidebar({
  minions,
  activeId,
  completionById = {},
  onSelect,
}) {
  if (!minions || minions.length === 0) return null

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1 ">
      {minions.map((minion) => {
        const isActive = minion.id === activeId
        const isComplete = Boolean(completionById[minion.id])

        return (
          <button
            key={minion.id}
            type="button"
            onClick={() => onSelect(minion.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-left transition hover:bg-black/60",
              isActive
                ? "border-white/30 bg-black/60"
                : "text-white"
            )}
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/50">
              <img
                src={minion.imageUrl}
                alt={minion.label}
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{minion.label}</p>
              {isComplete && (
                <p className="text-xs text-emerald-400/90">Complete</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
