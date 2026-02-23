import { useEffect, useMemo, useState } from "react"
import TitleBanner from "../components/TitleBanner"
import MinionSidebar from "../components/MinionSidebar"
import StrategyForm from "../components/StrategyForm"

const emptyConfig = { name: "", defense: "", strategy: "" }

function isFilled(value) {
  return String(value || "").trim().length > 0
}

export default function MinionStrategyPage({
  selectedMinions = [],
  configs = {},
  onUpdateConfig,
  onBack,
  onFinishAll,
}) {
  const [activeMinionId, setActiveMinionId] = useState(
    selectedMinions[0]?.id || null
  )

  useEffect(() => {
    if (!selectedMinions.length) return
    const stillExists = selectedMinions.some(
      (minion) => minion.id === activeMinionId
    )
    if (!stillExists) {
      setActiveMinionId(selectedMinions[0].id)
    }
  }, [activeMinionId, selectedMinions])

  const completionById = useMemo(() => {
    const map = {}
    selectedMinions.forEach((minion) => {
      const config = configs[minion.id] || emptyConfig
      map[minion.id] =
        isFilled(config.name) &&
        isFilled(config.defense) &&
        isFilled(config.strategy)
    })
    return map
  }, [configs, selectedMinions])

  const activeMinion = useMemo(() => {
    return (
      selectedMinions.find((minion) => minion.id === activeMinionId) ||
      selectedMinions[0] ||
      null
    )
  }, [activeMinionId, selectedMinions])

  const activeIndex = useMemo(() => {
    if (!activeMinion) return -1
    return selectedMinions.findIndex((minion) => minion.id === activeMinion.id)
  }, [activeMinion, selectedMinions])

  const { completedCount, allComplete } = useMemo(() => {
    const ids = selectedMinions.map((minion) => minion.id)
    const count = ids.filter((id) => {
      const config = configs[id]
      return (
        config &&
        config.name?.trim() &&
        String(config.defense ?? "").trim() &&
        config.strategy?.trim()
      )
    }).length
    return {
      completedCount: count,
      allComplete: ids.length > 0 && count === ids.length,
    }
  }, [configs, selectedMinions])

  useEffect(() => {
    if (!selectedMinions.length) return
    selectedMinions.forEach((minion) => {
      if (!configs[minion.id]) {
        onUpdateConfig?.(minion.id, {
          name: minion.label,
          defense: "",
          strategy: "",
        })
      }
    })
  }, [configs, onUpdateConfig, selectedMinions])

  if (!selectedMinions.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 text-white">
        <h1 className="text-2xl font-semibold">No minions selected.</h1>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-wider"
        >
          Back to Selection
        </button>
      </div>
    )
  }

  const activeConfig = activeMinion
    ? configs[activeMinion.id] || emptyConfig
    : emptyConfig

  return (
    <div className="relative min-h-screen overflow-hidden bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 pb-10 pt-6 md:px-6">
        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 rounded-3xl border border-white/10 bg-black/35 shadow-xl lg:h-[620px] lg:w-[320px] lg:max-w-[340px]">
            <MinionSidebar
              minions={selectedMinions}
              activeId={activeMinion?.id}
              completionById={completionById}
              onSelect={setActiveMinionId}
            />
          </aside>

          <section className="flex min-h-full flex-1 flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="w-20 shrink-0" />
              <div className="flex flex-col items-center gap-3 text-center">
                <TitleBanner
                  title="MINION STRATEGY"
                  className="scale-[1.05] md:scale-[1.1] lg:scale-[1.15]"
                />
                <p className="text-base font-semibold tracking-wide text-white/80 md:text-lg">
                  Configure each minion before entering the arena.
                </p>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-200 md:text-base">
                  {completedCount}/{selectedMinions.length} COMPLETE
                </p>
              </div>
              <div className="flex shrink-0 justify-end">
                <button
                  type="button"
                  onClick={onFinishAll}
                  disabled={!allComplete}
                  className={`rounded-md border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition md:px-6 md:py-2.5 md:text-sm ${
                    allComplete
                      ? "border-emerald-300 bg-emerald-300 text-black shadow-[0_0_18px_rgba(52,211,153,0.45)] hover:bg-emerald-200"
                      : "border-white/20 bg-black/30 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Finish
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1160px]">
              <StrategyForm
                minion={activeMinion}
                value={activeConfig}
                onChange={(patch) =>
                  activeMinion && onUpdateConfig(activeMinion.id, patch)
                }
                onPrev={() =>
                  activeIndex > 0 &&
                  setActiveMinionId(selectedMinions[activeIndex - 1].id)
                }
                onNext={() =>
                  activeIndex < selectedMinions.length - 1 &&
                  setActiveMinionId(selectedMinions[activeIndex + 1].id)
                }
                canGoPrev={activeIndex > 0}
                canGoNext={activeIndex < selectedMinions.length - 1}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-white/30 bg-black/40 px-5 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-white/60 hover:bg-black/60"
              >
                Back to Selection
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
