function MinionCard({ minion, disabled, onSelect, priceLabel }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(minion)}
      className={[
        "group rounded-[28px] border p-4 text-left transition",
        "border-white/8 bg-[#141a3a]/92 shadow-[0_18px_50px_rgba(0,0,0,0.28)]",
        "hover:border-amber-200/35 hover:bg-[#1a2146] disabled:cursor-not-allowed disabled:opacity-40",
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[22px] bg-[#f3f4f7] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-200/10 to-transparent" />
        <div className="aspect-[4/5] w-full max-h-[250px] overflow-hidden">
          <img
            src={minion.imageUrl || "/minion-robot.png"}
            alt={minion.name}
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.04]"
            draggable={false}
          />
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-2xl font-bold tracking-wide text-white">{minion.name}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/65">
            <span>
              HP: <span className="font-bold text-rose-300">100</span>
            </span>
            <span>
              DEF: <span className="font-bold text-sky-300">{minion.defense}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
          {priceLabel}
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/8 bg-slate-950/40 p-3">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Strategy</p>
        <div className="mt-2 max-h-40 overflow-y-auto pr-1">
          <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
            {minion.strategy || "No strategy"}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function SpawnModal({
  open,
  selectedHex,
  mana,
  minionTypes,
  isFreeSpawn = false,
  onClose,
  onSelectMinion,
}) {
  if (!open || !selectedHex) return null

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(250,204,21,0.14),transparent_24%),linear-gradient(180deg,rgba(3,7,19,0.44),rgba(2,6,23,0.76))] p-2 backdrop-blur-2xl md:p-3">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_52%)]" />
        <div className="absolute left-[5%] top-[8%] h-80 w-80 rounded-full bg-cyan-300/10 blur-[130px]" />
        <div className="absolute right-[7%] top-[12%] h-96 w-96 rounded-full bg-amber-200/12 blur-[150px]" />
        <div className="absolute bottom-[4%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-indigo-400/12 blur-[170px]" />
        <div className="absolute bottom-[10%] right-[18%] h-72 w-72 rounded-full bg-violet-300/8 blur-[135px]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-16px)] w-[min(1920px,calc(100vw-16px))] flex-col overflow-hidden rounded-[42px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(10,16,40,0.96),rgba(8,12,30,0.94))] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_90px_rgba(2,6,23,0.75),0_0_50px_rgba(250,204,21,0.10)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
          <div className="absolute inset-x-10 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,233,160,0.12),transparent_60%)]" />
          <div className="absolute left-[-6rem] top-[18%] h-72 w-72 rounded-full border border-cyan-200/8 bg-cyan-300/5 blur-3xl" />
          <div className="absolute right-[-8rem] bottom-[12%] h-80 w-80 rounded-full border border-amber-200/8 bg-amber-200/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-16px)] flex-col p-6 md:p-8">
        <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Choose Minion Type</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Spawn on Hex {selectedHex.row},{selectedHex.col}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              Select a configured minion type to spawn immediately on the highlighted hex.
              Cards are disabled if you do not have enough mana.
            </p>
            {isFreeSpawn ? (
              <p className="mt-3 text-lg font-bold uppercase tracking-wide text-emerald-300">
                First spawn on turn 1 is free for this player.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-full border border-amber-200/20 bg-black/35 px-5 py-2.5 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mana</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">{mana}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition hover:bg-white/10"
              aria-label="Close shop"
            >
              <img src="/back.png" alt="" className="h-8 w-auto" draggable={false} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {minionTypes.map((minion) => (
              <MinionCard
                key={minion.id}
                minion={minion}
                priceLabel={isFreeSpawn ? "Free" : `${minion.price} Mana`}
                disabled={!isFreeSpawn && mana < minion.price}
                onSelect={onSelectMinion}
              />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
