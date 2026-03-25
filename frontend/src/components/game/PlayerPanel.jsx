import { useEffect, useRef, useState } from "react"
import { ASSETS } from "../../constants/assets"
import { cn } from "../../utils/cn"

export default function PlayerPanel({
  player,
  active,
  budget,
  hp,
  inventory,
  onShop,
}) {
  const p1 = player === "P1"
  const prevHpRef = useRef(hp)
  const [flashHp, setFlashHp] = useState(false)

  useEffect(() => {
    if (hp < prevHpRef.current) {
      setFlashHp(true)
      const timeoutId = window.setTimeout(() => setFlashHp(false), 300)
      prevHpRef.current = hp
      return () => window.clearTimeout(timeoutId)
    }

    prevHpRef.current = hp
    return undefined
  }, [hp])

  return (
    <div
      className={cn(
        "relative w-full max-w-[320px] space-y-4 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f172a]/90 to-[#020617]/90 p-5 text-white shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]",
        p1 ? "shadow-[inset_0_0_0_1px_rgba(56,189,248,0.16)]" : "shadow-[inset_0_0_0_1px_rgba(251,113,133,0.16)]",
        active
          ? "ring-2 ring-blue-400/60 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
          : "opacity-70 blur-[0.2px]"
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-20 w-40 -translate-x-1/2 bg-blue-400/10 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm tracking-widest text-blue-200/80">PLAYER</p>
          <p className="text-2xl font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
            {p1 ? "1" : "2"}
          </p>
        </div>
        <img
          src={ASSETS.player}
          alt=""
          className="h-12 w-12 object-contain opacity-95 [image-rendering:auto]"
          draggable={false}
        />
      </div>

      <div className="relative grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">MANA</span>
              <div className="relative flex items-center gap-2">
                <div className="relative h-3 w-3 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-[0_0_12px_rgba(255,215,0,0.8)] animate-pulse before:absolute before:h-1 before:w-1 before:rounded-full before:bg-yellow-300 before:animate-ping" />
                <span className="text-sm font-semibold tracking-wide text-white">
                  {budget}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>HP</span>
              <span>{hp}</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 transition-all duration-500 ease-out",
                  flashHp && "animate-[pulse_0.3s_ease]"
                )}
                style={{ width: `${hp}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onShop}
        disabled={!active}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-600/80 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        SUMMON
      </button>

      <div className="relative">
        <p className="mb-2 text-sm tracking-widest text-blue-200/80">INVENTORY</p>
        {inventory.length === 0 ? (
          <p className="text-sm italic text-slate-300 opacity-80">Empty</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {inventory.map((item, i) => (
              <div
                key={`${player}-${item.id || item}-${i}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                title={item.label || item.id}
              >
                {item.iconUrl ? (
                  <img
                    src={item.iconUrl}
                    alt=""
                    className="h-7 w-7 object-contain [image-rendering:auto]"
                    draggable={false}
                  />
                ) : (
                  (item.label || item.id || "?").slice(0, 2)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
