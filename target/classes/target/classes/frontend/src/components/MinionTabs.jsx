export default function MinionTabs({
  minions,
  activeId,
  completionById = {},
  onSelect,
}) {
  if (!minions || minions.length === 0) return null

  return (
    <div className="px-6">
      <div className="flex gap-3 overflow-x-auto pb-3">
        {minions.map((minion) => {
          const isActive = minion.id === activeId
          const isComplete = Boolean(completionById[minion.id])

          return (
            <button
              key={minion.id}
              type="button"
              onClick={() => onSelect(minion.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition md:text-sm ${
                isActive
                  ? "border-amber-300 bg-amber-200 text-slate-900"
                  : "border-white/30 bg-white/10 text-white/80 hover:border-white/60"
              }`}
            >
              <span>{minion.label}</span>
              {isComplete && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-black">
                  OK
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
