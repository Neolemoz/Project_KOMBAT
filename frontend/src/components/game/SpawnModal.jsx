function truncate(text, max = 72) {
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function MinionCard({ minion, disabled, onSelect }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(minion)}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition hover:border-cyan-300/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{minion.name}</h3>
          <p className="mt-1 text-sm text-slate-300">Defense {minion.defense}</p>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">
          {minion.price} Mana
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Strategy</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          {truncate(minion.strategy)}
        </p>
      </div>
    </button>
  )
}

export default function SpawnModal({
  open,
  selectedHex,
  mana,
  minionTypes,
  onClose,
  onSelectMinion,
}) {
  if (!open || !selectedHex) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[3px]">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[rgba(6,10,24,0.92)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Choose Minion Type</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Spawn on Hex {selectedHex.row},{selectedHex.col}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Select a configured minion type to spawn immediately on the highlighted hex.
              Cards are disabled if you do not have enough mana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mana</p>
              <p className="mt-1 text-xl font-bold text-cyan-100">{mana}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {minionTypes.map((minion) => (
            <MinionCard
              key={minion.id}
              minion={minion}
              disabled={mana < minion.price}
              onSelect={onSelectMinion}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
