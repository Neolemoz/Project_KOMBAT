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
    <div className="w-full">
      {/* Top row: editing + prev/next */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={minion.imageUrl}
            alt={minion.label}
            className="h-14 w-14 rounded-lg bg-gray-100 p-2 object-contain"
            draggable="false"
          />
          <div>
            <div className="text-[11px] tracking-[0.25em] text-gray-400">
              EDITING
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {minion.label}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={safeValue.name}
            onChange={handleFieldChange("name")}
            placeholder="Give this minion a name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none
                       focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Defense Factor
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={safeValue.defense}
            onChange={handleFieldChange("defense")}
            placeholder="e.g. 12.5 or High"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none
                       focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="mt-10">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Strategy
        </label>
        <textarea
          rows={10}
          value={safeValue.strategy}
          onChange={handleFieldChange("strategy")}
          placeholder="Describe how this minion should behave in battle"
          className="w-full min-h-[320px] resize-none rounded-2xl border border-gray-300 px-4 py-4
                     text-base outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Footer */}
      <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onValidate}
          disabled={!onValidate || validateLoading}
          className="rounded-xl bg-gray-200 px-6 py-3 text-gray-700
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          {validateLoading ? "Validating..." : "Validate Strategy"}
        </button>

        {validateResult && (
          <div
            className={`text-sm ${
              validateResult.ok ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {validateResult.message}
          </div>
        )}
      </div>
    </div>
  )
}