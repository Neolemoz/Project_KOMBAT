import { Button } from "../ui/Button"
import { TextField } from "../ui/TextField"
import { TextArea } from "../ui/TextArea"

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
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1">
            <img
              src={minion.imageUrl}
              alt={minion.label}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
          <div>
            <p className="text-xs text-white/50">Editing</p>
            <p className="text-lg font-semibold text-white">{minion.label}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" type="button" onClick={onPrev} disabled={!canGoPrev}>
            Previous
          </Button>
          <Button variant="ghost" type="button" onClick={onNext} disabled={!canGoNext}>
            Next
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField
          label="Name"
          id={`minion-name-${minion.id}`}
          value={safeValue.name}
          onChange={handleFieldChange("name")}
          placeholder="Minion name"
          autoComplete="off"
        />
        <TextField
          label="Defense"
          id={`minion-defense-${minion.id}`}
          value={safeValue.defense}
          onChange={handleFieldChange("defense")}
          placeholder="e.g. 12.5"
          inputMode="decimal"
          autoComplete="off"
        />
      </div>

      <TextArea
        label="Strategy"
        id={`minion-strategy-${minion.id}`}
        value={safeValue.strategy}
        onChange={handleFieldChange("strategy")}
        placeholder="Describe intended behavior"
        rows={10}
        className="mt-6"
      />

      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="primary"
          onClick={onValidate}
          disabled={!onValidate || validateLoading}
        >
          {validateLoading ? "Validating…" : "Validate strategy"}
        </Button>
        {validateResult ? (
          <p
            className={`text-sm ${
              validateResult.ok ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {validateResult.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
