import { useState } from "react"
import {
  PageShell,
  PageTopBar,
  BackButton,
} from "../components/layout"
import { Button } from "../components/ui/Button"
import { ASSETS } from "../constants/assets"
import { cn } from "../utils/cn"

const TYPES = ["I", "II", "III", "IV", "V"]

export default function MinionTypePage({ onBack, onConfirm }) {
  const [selectedType, setSelectedType] = useState("I")
  const [p1Confirmed, setP1Confirmed] = useState(false)
  const [p2Confirmed, setP2Confirmed] = useState(false)

  const canContinue = p1Confirmed && p2Confirmed

  const handleSelect = (type) => {
    if (type !== selectedType) {
      setSelectedType(type)
    }
    if (p1Confirmed) setP1Confirmed(false)
    if (p2Confirmed) setP2Confirmed(false)
  }

  return (
    <PageShell bg={ASSETS.modeBg} innerClassName="relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[120px]" />

      <div className="relative z-10 flex h-full flex-col">
        <PageTopBar back={<BackButton onClick={onBack} />} />

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative z-10 mb-10 text-center">
            <div className="inline-block rounded-xl border border-white/10 bg-black/40 px-8 py-4 backdrop-blur-md">
              <h1
                className="
                  text-4xl font-bold tracking-[0.15em]
                  text-white
                  drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]
                  sm:text-5xl
                "
              >
                MINION TYPE
              </h1>

              <p className="mt-2 text-sm tracking-wide text-white/70">
                CURRENT SELECTION: {selectedType}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {TYPES.map((type) => {
              const isSelected = type === selectedType
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect(type)}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex h-20 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg font-semibold text-white/80 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20",
                    isSelected &&
                      "scale-110 bg-orange-500/90 text-white shadow-[0_0_25px_rgba(255,140,0,0.8)] after:absolute after:inset-0 after:rounded-xl after:ring-2 after:ring-orange-400 after:opacity-70"
                  )}
                >
                  {type}
                </button>
              )
            })}
          </div>

          <div className="mx-auto mt-12 flex w-full max-w-3xl flex-col items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md sm:flex-row">
            <div className="flex items-center gap-3 text-white">
              <Button
                variant={p1Confirmed ? "primary" : "secondary"}
                type="button"
                className="px-4 py-2"
                onClick={() => setP1Confirmed((p) => !p)}
              >
                P1
              </Button>
              <span className={cn("text-sm", p1Confirmed ? "text-green-400" : "text-white/60")}>
                {p1Confirmed ? "READY" : "WAITING"}
              </span>
            </div>

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => onConfirm(selectedType)}
              className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
            >
              CONTINUE
            </button>

            <div className="flex items-center gap-3 text-white">
              <Button
                variant={p2Confirmed ? "primary" : "secondary"}
                type="button"
                className="px-4 py-2"
                onClick={() => setP2Confirmed((p) => !p)}
              >
                P2
              </Button>
              <span className={cn("text-sm", p2Confirmed ? "text-green-400" : "text-white/60")}>
                {p2Confirmed ? "READY" : "WAITING"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
