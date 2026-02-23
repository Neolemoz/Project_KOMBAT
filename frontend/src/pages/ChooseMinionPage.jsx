import { useState } from "react"
import TitleBanner from "../components/TitleBanner"

const MINIONS = [
  { id: "palrose", label: "Palrose", imageUrl: "/minion-paladin.png" },
  { id: "robolo", label: "Robolo", imageUrl: "/minion-robot.png" },
  { id: "stony", label: "Stony", imageUrl: "/minion-assassin.png" },
  { id: "warrior", label: "Warrior", imageUrl: "/minion-priest.png" },
  { id: "celeb", label: "Celeb", imageUrl: "/minion-mage.png" },
]

function toAllowedCount(minionType) {
  const normalized = String(minionType || "").trim().toUpperCase()
  const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
  if (romanMap[normalized]) return romanMap[normalized]
  const numeric = parseInt(normalized, 10)
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) return numeric
  return 1
}

export default function ChooseMinionPage({ minionType, onBack, onContinue }) {
  const [selectedMinions, setSelectedMinions] = useState([])
  const [p1Confirmed, setP1Confirmed] = useState(false)
  const [p2Confirmed, setP2Confirmed] = useState(false)
  const [limitMessage, setLimitMessage] = useState("")

  const allowedCount = toAllowedCount(minionType)
  const selectionComplete = selectedMinions.length === allowedCount

  const selectedNames = MINIONS
    .filter((m) => selectedMinions.includes(m.id))
    .map((m) => m.label)

  const handleCardClick = (id) => {
    setSelectedMinions((prev) => {
      if (prev.includes(id)) {
        setLimitMessage("")
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= allowedCount) {
        setLimitMessage(
          `You can only choose ${allowedCount} minion(s). Unselect one first.`
        )
        return prev
      }
      setLimitMessage("")
      return [...prev, id]
    })

    if (p1Confirmed) setP1Confirmed(false)
    if (p2Confirmed) setP2Confirmed(false)
  }

  const handleP1Confirm = () => {
    if (!selectionComplete) return
    setP1Confirmed((prev) => !prev)
  }

  const handleP2Confirm = () => {
    if (!selectionComplete) return
    setP2Confirmed((prev) => !prev)
  }

  const handleContinue = () => {
    if (!selectionComplete || !p1Confirmed || !p2Confirmed) return
    const selectedMinionObjects = MINIONS.filter((minion) =>
      selectedMinions.includes(minion.id)
    ).map((minion) => ({
      id: minion.id,
      label: minion.label,
      imageUrl: minion.imageUrl,
    }))
    onContinue({ selectedMinions: selectedMinionObjects })
  }

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-black/55 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="px-6 pt-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-white/60 hover:bg-black/60"
            >
              ? Back
            </button>
          </div>
        </div>

        <TitleBanner title="CHOOSE MINION" />

        <div className="px-6">
          <p className="mt-2 text-center text-sm font-semibold tracking-wide text-white/80 md:text-base">
            Choose {allowedCount} minion
          </p>
          <p className="mt-2 text-center text-xs font-semibold tracking-wide text-white/80 md:text-sm">
            Selected: {selectedNames.length ? selectedNames.join(", ") : "(none)"}
          </p>
          {limitMessage && (
            <p className="mt-2 text-center text-xs font-semibold tracking-wide text-amber-200">
              {limitMessage}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto px-8 pb-32">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-6xl">
              <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {MINIONS.map((minion) => {
                  const isSelected = selectedMinions.includes(minion.id)
                  return (
                    <button
                      key={minion.id}
                      type="button"
                      onClick={() => handleCardClick(minion.id)}
                      className={`relative flex w-full flex-col items-center rounded-2xl bg-white p-3 transition duration-200 hover:-translate-y-1 ${
                        isSelected
                          ? "ring-4 ring-amber-300/80 shadow-[0_0_30px_rgba(255,215,120,0.35)] scale-[1.02]"
                          : "shadow-lg hover:shadow-2xl"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-black shadow">
                          ?
                        </span>
                      )}
                      <div className="w-full rounded-xl bg-white p-2">
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={minion.imageUrl}
                            alt={minion.label}
                            className="h-full w-full object-contain"
                            draggable="false"
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-center font-['Cinzel'] text-lg font-semibold tracking-wider text-amber-800">
                        {minion.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-between items-center z-20">
          <button
            type="button"
            onClick={handleP1Confirm}
            disabled={!selectionComplete}
            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
              selectionComplete
                ? "border-white/30 bg-black/40 text-white hover:border-white/60 hover:bg-black/60"
                : "border-white/20 bg-black/30 text-white/40"
            }`}
          >
            OK (P1)
            {p1Confirmed && (
              <span className="ml-2 text-xs font-semibold text-emerald-300">
                Confirmed
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectionComplete || !p1Confirmed || !p2Confirmed}
            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
              selectionComplete && p1Confirmed && p2Confirmed
                ? "border-amber-300 bg-amber-300 text-black hover:bg-amber-200"
                : "border-white/20 bg-black/30 text-white/40"
            }`}
          >
            CONTINUE
          </button>

          <button
            type="button"
            onClick={handleP2Confirm}
            disabled={!selectionComplete}
            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
              selectionComplete
                ? "border-white/30 bg-black/40 text-white hover:border-white/60 hover:bg-black/60"
                : "border-white/20 bg-black/30 text-white/40"
            }`}
          >
            OK (P2)
            {p2Confirmed && (
              <span className="ml-2 text-xs font-semibold text-emerald-300">
                Confirmed
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
