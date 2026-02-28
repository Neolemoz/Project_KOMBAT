import { useEffect, useMemo, useState } from "react"
import TitleBanner from "../components/TitleBanner"
import MinionSidebar from "../components/MinionSidebar"
import StrategyForm from "../components/StrategyForm"
import { validateStrategy } from "../api/strategyApi"

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
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [drafts, setDrafts] = useState({})
  const [validateLoading, setValidateLoading] = useState(false)
  const [validateResult, setValidateResult] = useState(null)

  useEffect(() => {
    if (!selectedMinions.length) return
    setSelectedIndex((prev) => {
      if (prev < 0) return 0
      if (prev >= selectedMinions.length) return selectedMinions.length - 1
      return prev
    })
  }, [selectedMinions])

  useEffect(() => {
    if (!selectedMinions.length) return
    setDrafts((prev) => {
      const next = { ...prev }
      selectedMinions.forEach((minion) => {
        if (!next[minion.id]) {
          next[minion.id] = {
            name: minion.label || "",
            defense: "",
            strategy: "",
            ...(configs[minion.id] || {}),
          }
        }
      })
      return next
    })
  }, [configs, selectedMinions])

  const completionById = useMemo(() => {
    const map = {}
    selectedMinions.forEach((minion) => {
      const config = drafts[minion.id] || emptyConfig
      map[minion.id] =
        isFilled(config.name) &&
        isFilled(config.defense) &&
        isFilled(config.strategy)
    })
    return map
  }, [drafts, selectedMinions])

  const activeMinion = useMemo(() => {
    return selectedMinions[selectedIndex] || null
  }, [selectedIndex, selectedMinions])

  useEffect(() => {
    setValidateResult(null)
  }, [selectedIndex])

  const { completedCount, allComplete } = useMemo(() => {
    const ids = selectedMinions.map((minion) => minion.id)
    const count = ids.filter((id) => {
      const config = drafts[id]
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
  }, [drafts, selectedMinions])

  if (!selectedMinions.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 text-white">
        <h1 className="text-2xl font-semibold">No minions selected.</h1>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-wider"
        >
          <img
            src="/back.png"
            alt="Back to Selection"
            className="h-10 w-auto md:h-12"
            draggable="false"
          />
        </button>
      </div>
    )
  }

  const activeConfig = activeMinion
    ? drafts[activeMinion.id] || emptyConfig
    : emptyConfig

    const handleValidate = async () => {
        if (!activeMinion) return

        if (!activeConfig.strategy?.trim()) {
            setValidateResult({
                ok: false,
                message: "Strategy script is empty",
            })
            return
        }

        setValidateLoading(true)
        setValidateResult(null)

        try {
            const response = await validateStrategy({
                script: activeConfig.strategy ?? "",
            })

            if (response && response.valid === false) {
                setValidateResult({
                    ok: false,
                    message: response.error || "Invalid strategy",
                })
            } else {
                setValidateResult({
                    ok: true,
                    message: "Grammar is valid",
                })
            }
        } catch (error) {
            setValidateResult({
                ok: false,
                message: error?.message || "Validation failed",
            })
        } finally {
            setValidateLoading(false)
        }
    }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="pointer-events-none absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="pointer-events-none fixed top-4 left-0 right-0 z-20 flex justify-center px-4">
          <div className="w-full max-w-5xl">
            <div className="flex flex-col items-center gap-2 text-center">
              <TitleBanner
                title="MINION STRATEGY"
                className="scale-[1.05] md:scale-[1.1] lg:scale-[1.15]"
              />
              <p className="text-[11px] font-semibold tracking-wide text-white/80 md:text-xs">
                Configure each minion before entering the arena.
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200 md:text-xs">
                {completedCount}/{selectedMinions.length} COMPLETE
              </p>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col gap-6 px-4 pt-40 md:px-6 lg:flex-row lg:pt-44">
          <aside className="w-full shrink-0 rounded-3xl border border-white/10 bg-black/35 shadow-xl lg:w-[300px] lg:max-w-[300px] lg:self-start">
            <MinionSidebar
              minions={selectedMinions}
              activeId={activeMinion?.id}
              completionById={completionById}
              onSelect={(id) => {
                const index = selectedMinions.findIndex(
                  (minion) => minion.id === id
                )
                if (index >= 0) setSelectedIndex(index)
              }}
            />
          </aside>

          <section className="flex min-h-0 flex-1 flex-col gap-6 lg:self-stretch">
            <div className="flex justify-end">
              {allComplete && (
                <button
                  type="button"
                  onClick={onFinishAll}
                  className="fixed right-6 top-6 z-30 rounded-md border-2 border-green-500 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-green-400 transition hover:bg-green-900/50 md:px-6 md:py-2.5 md:text-sm"
                >
                  Finish
                </button>
              )}
            </div>

            <div className="mx-auto mt-auto w-full max-w-[1160px]">
              <StrategyForm
                minion={activeMinion}
                value={activeConfig}
                onChange={(patch) => {
                  if (!activeMinion) return
                  setDrafts((prev) => {
                    const current = prev[activeMinion.id] || emptyConfig
                    return {
                      ...prev,
                      [activeMinion.id]: { ...current, ...patch },
                    }
                  })
                  onUpdateConfig?.(activeMinion.id, patch)
                }}
                onPrev={() =>
                  setSelectedIndex((index) => Math.max(0, index - 1))
                }
                onNext={() =>
                  setSelectedIndex((index) =>
                    Math.min(selectedMinions.length - 1, index + 1)
                  )
                }
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < selectedMinions.length - 1}
                onValidate={handleValidate}
                validateLoading={validateLoading}
                validateResult={validateResult}
              />
            </div>
          </section>
        </main>

        <button
          type="button"
          onClick={onBack}
          className="fixed left-6 top-6 z-30 rounded-md p-1 transition hover:scale-105"
        >
          <img
            src="/back.png"
            alt="Back to Selection"
            className="h-10 w-auto md:h-12"
            draggable="false"
          />
        </button>
      </div>
    </div>
  )
}
