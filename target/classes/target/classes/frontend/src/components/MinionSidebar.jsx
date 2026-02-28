export default function MinionSidebar({
  minions,
  activeId,
  completionById = {},
  onSelect,
}) {
  if (!minions || minions.length === 0) return null

  return (
    <div className="flex h-full w-full flex-col gap-4 px-5 py-6 lg:gap-5 lg:py-8">
      {minions.map((minion) => {
        const isActive = minion.id === activeId
        const isComplete = Boolean(completionById[minion.id])

        return (
          <button
            key={minion.id}
            type="button"
            onClick={() => onSelect(minion.id)}
            className={`group relative flex h-[96px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition lg:h-[104px] ${
              isActive
                ? "border-amber-300 bg-white/15 shadow-[0_0_25px_rgba(255,215,120,0.45)]"
                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
            }`}
          >
            <div className="h-[68px] w-[68px] overflow-hidden rounded-xl bg-white/90 shadow lg:h-[72px] lg:w-[72px]">
              <img
                src={minion.imageUrl}
                alt={minion.label}
                className="h-full w-full object-contain"
                draggable="false"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 lg:text-sm">
                Minion
              </p>
              <p className="truncate text-lg font-semibold text-white lg:text-xl">
                {minion.label}
              </p>
            </div>
            {isComplete && (
              <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-black shadow">
                &#10003;
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
