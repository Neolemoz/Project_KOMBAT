export default function StrategyForm({
  minion,
  value,
  onChange,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  onValidate,
  validateLoading,
  validateResult,
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
    <div className="relative z-20 w-full max-w-3xl mx-auto rounded-t-3xl rounded-b-none bg-white/95 p-6 shadow-2xl md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-12 overflow-hidden rounded-xl bg-white shadow md:h-20 md:w-16">
            <img
              src={minion.imageUrl}
              alt={minion.label}
              className="h-full w-full object-contain"
              draggable="false"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:text-xs">
              Editing
            </p>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
              {minion.label}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`rounded-md border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-2 md:text-xs ${
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
            className={`rounded-md border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-2 md:text-xs ${
              canGoNext
                ? "border-slate-300 text-slate-700 hover:border-slate-500"
                : "border-slate-200 text-slate-300"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 md:text-sm">
            Name
          </label>
          <input
            type="text"
            value={safeValue.name}
            onChange={handleFieldChange("name")}
            placeholder="Give this minion a name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:px-4 md:py-3 md:text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 md:text-sm">
            Defense Factor
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={safeValue.defense}
            onChange={handleFieldChange("defense")}
            placeholder="e.g. 12.5 or High"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:px-4 md:py-3 md:text-base"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 md:text-sm">
            Strategy
          </label>
          <textarea
            rows={10}
            value={safeValue.strategy}
            onChange={handleFieldChange("strategy")}
            placeholder="Describe how this minion should behave in battle"
            className="min-h-[260px] w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 md:min-h-[320px] md:px-4 md:py-3 md:text-base"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onValidate}
              disabled={!onValidate || validateLoading}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {validateLoading ? "Validating..." : "Validate Strategy"}
            </button>
            {validateResult && (
              <span
                className={`text-xs font-semibold ${
                  validateResult.ok ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {validateResult.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
