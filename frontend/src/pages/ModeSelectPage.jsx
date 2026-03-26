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

      <div className={cn("flex flex-col sm:flex-row justify-center items-center gap-20 ", pageUi.mainGap)}>
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => onSelectMode(mode.key)}
            className="relative flex w-full max-w-[320px] h-[350px] items-center justify-center
            overflow-hidden rounded-xl transition-transform hover:-translate-y-2 group mt-8 "
            style={{ height: "clamp(380px, 37vh, 500px)" }}
          >
              <img
                src={mode.img}
                alt={mode.label}
                className="w-full h-full max-w-full object-contain"
                draggable="false"
              />
                <div className="absolute bottom-11 left-0 right-0 flex justify-center">
                    <span className="text-16px font-semibold font-['Cinzel'] uppercase
                     bg-gradient-to-r from-[#844d17] to-[#1b89e2] bg-clip-text text-transparent
                     [-webkit-text-stroke:0.2px_#74665c]
                     drop-shadow">{mode.label}</span>
                </div>

          </button>
        ))}
      </div>
    </PageShell>
  )
}
