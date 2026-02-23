export default function StrategyForm({
  minion,
  value,
  onChange,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}) {
  if (!minion) return null

  const safeValue = {
    name: "",
    defense: "",
    strategy: "",
    ...value,
  }

  const handleFieldChange = (field) => (event) => {
    if (!onChange) return
    onChange({ [field]: event.target.value })
  }

  return (
    <div className="rounded-3xl bg-white/95 p-8 shadow-2xl md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-20 w-16 overflow-hidden rounded-xl bg-white shadow md:h-24 md:w-20">
            <img
              src={minion.imageUrl}
              alt={minion.label}
              className="h-full w-full object-contain"
              draggable="false"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 md:text-sm">
              Editing
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              {minion.label}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition md:px-5 md:py-2.5 md:text-sm ${
              canGoPrev
                ? "border-slate-300 text-slate-700 hover:border-slate-500"
                : "border-slate-200 text-slate-300"
            }`}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition md:px-5 md:py-2.5 md:text-sm ${
              canGoNext
                ? "border-slate-300 text-slate-700 hover:border-slate-500"
                : "border-slate-200 text-slate-300"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-7">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-widest text-slate-600 md:text-base">
            Name
          </label>
          <input
            type="text"
            value={safeValue.name}
            onChange={handleFieldChange("name")}
            placeholder="Give this minion a name"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-widest text-slate-600 md:text-base">
            Defense Factor
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={safeValue.defense}
            onChange={handleFieldChange("defense")}
            placeholder="e.g. 12.5 or High"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:text-lg"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-semibold uppercase tracking-widest text-slate-600 md:text-base">
            Strategy
          </label>
          <textarea
            rows={10}
            value={safeValue.strategy}
            onChange={handleFieldChange("strategy")}
            placeholder="Describe how this minion should behave in battle"
            className="min-h-[320px] w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:min-h-[380px] md:text-lg"
          />
        </div>
      </div>
    </div>
  )
}
