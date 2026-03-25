import { useState } from "react"
import {
  PageShell,
  PageTitle,
  PageTopBar,
  BackButton,
  PageSection,
} from "../components/layout"
import { Button } from "../components/ui/Button"
import { ASSETS } from "../constants/assets"
import { pageUi } from "../constants/pageUi"
import { cn } from "../utils/cn"

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

  const selectedNames = MINIONS.filter((m) => selectedMinions.includes(m.id)).map(
    (m) => m.label
  )

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
    <PageShell bg={ASSETS.modeBg}>
      <PageTopBar back={<BackButton onClick={onBack} />} />

      <PageTitle
        title="Choose minion"
        subtitle={`Pick ${allowedCount} minion${allowedCount === 1 ? "" : "s"}.`}
        className={pageUi.titleBlock}
      />

      <p className={cn(pageUi.metaText, "mb-2")}>
        Selected: {selectedNames.length ? selectedNames.join(", ") : "—"}
      </p>
      {limitMessage && (
        <p className="mb-8 text-center text-sm text-amber-200">{limitMessage}</p>
      )}

      <div className={cn("mb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5", pageUi.mainGap)}>
        {MINIONS.map((minion) => {
          const isSelected = selectedMinions.includes(minion.id)
          return (
            <button
              key={minion.id}
              type="button"
              onClick={() => handleCardClick(minion.id)}
              className={cn(
                "relative p-2",
                pageUi.card,
                isSelected && pageUi.cardSelected
              )}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">
                  ✓
                </span>
              )}
              <div className="mb-2 aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <img
                  src={minion.imageUrl}
                  alt={minion.label}
                  className="h-full w-full object-contain p-1"
                  draggable={false}
                />
              </div>
              <span className="text-xs font-medium text-white md:text-sm">{minion.label}</span>
            </button>
          )
        })}
      </div>

      <PageSection className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <Button
          variant={p1Confirmed ? "primary" : "secondary"}
          type="button"
          disabled={!selectionComplete}
          onClick={() => selectionComplete && setP1Confirmed((p) => !p)}
        >
          OK (P1)
        </Button>

        <Button
          variant="primary"
          type="button"
          disabled={!selectionComplete || !p1Confirmed || !p2Confirmed}
          onClick={handleContinue}
        >
          Continue
        </Button>

        <Button
          variant={p2Confirmed ? "primary" : "secondary"}
          type="button"
          disabled={!selectionComplete}
          onClick={() => selectionComplete && setP2Confirmed((p) => !p)}
        >
          OK (P2)
        </Button>
      </PageSection>
    </PageShell>
  )
}
