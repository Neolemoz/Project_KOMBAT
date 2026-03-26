import { PageShell, PageTitle, PageTopBar, BackButton } from "../components/layout"
import { ASSETS } from "../constants/assets"
import { pageUi } from "../constants/pageUi"
import { cn } from "../utils/cn"

export default function ModeSelectPage({ onBack, onSelectMode }) {
  const modes = [
    { key: "DUEL", label: "Duel", img: "/mode-duel.png" },
    { key: "SOLITAIRE", label: "Solitaire", img: "/mode-solo.png" },
    { key: "AUTO", label: "Auto", img: "/mode-auto.png" },
  ]

  return (
    <PageShell bg={ASSETS.modeBg}>
      <PageTopBar back={<BackButton onClick={onBack} />} />
      <PageTitle
        title="Select mode"
        subtitle="Choose how you want to play."
        className={pageUi.titleBlock}
      />

      <div className={cn("grid sm:grid-cols-3", pageUi.mainGap)}>
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => onSelectMode(mode.key)}
            className={cn(
              "flex flex-col items-center p-4",
              pageUi.card
            )}
          >
            <div className="mb-3 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <img
                src={mode.img}
                alt=""
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
            <span className="text-sm font-medium text-white">{mode.label}</span>
          </button>
        ))}
      </div>
    </PageShell>
  )
}
