import { useEffect, useMemo, useState } from "react"
import {
  PageShell,
  PageTitle,
  PageTopBar,
  BackButton,
} from "../components/layout"
import MinionSidebar from "../components/minions/MinionSidebar"
import StrategyForm from "../components/forms/StrategyForm"
import { validateStrategy } from "../services/strategyService"
import { Button } from "../components/ui/Button"
import { Panel } from "../components/ui/Panel"
import { ASSETS } from "../constants/assets"
import { pageUi } from "../constants/pageUi"
import { cn } from "../utils/cn"
import { getTemplatesForMinion } from "../constants/strategyTemplates"

const emptyValidation = { ok: false, message: null }
const emptyConfig = {
  name: "",
  defense: "",
  strategy: "",
  validationStatus: null,
}

function isFilled(value) {
  return String(value || "").trim().length > 0
}

function isPositiveDefense(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0
}

function normalizeConfig(minion, config = {}) {
  return {
    name: String(config.name ?? "").trim() || minion?.label || "",
    defense: config.defense ?? "",
    strategy: config.strategy ?? "",
    validationStatus:
      config.validationStatus && typeof config.validationStatus === "object"
        ? {
            ok: Boolean(config.validationStatus.ok),
            message: config.validationStatus.message ?? null,
          }
        : null,
  }
}

function getValidationResult(config) {
  return config?.validationStatus ?? null
}

function canAdvanceFromConfig(config) {
  return (
    isFilled(config?.name) &&
    isPositiveDefense(config?.defense) &&
    Boolean(config?.validationStatus?.ok)
  )
}

export default function MinionStrategyPage({
  selectedMinions = [],
  configs = {},
  setupErrorMessage = null,
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
        next[minion.id] = normalizeConfig(
          minion,
          prev[minion.id] ?? configs[minion.id] ?? emptyConfig
        )
      })
      return next
    })
  }, [configs, selectedMinions])

  const activeMinion = useMemo(() => {
    return selectedMinions[selectedIndex] || null
  }, [selectedIndex, selectedMinions])

  const activeConfig = activeMinion
    ? drafts[activeMinion.id] || normalizeConfig(activeMinion, emptyConfig)
    : emptyConfig

  useEffect(() => {
    setValidateResult(getValidationResult(activeConfig))
  }, [activeConfig])

  const persistConfig = (minionId, updater) => {
    if (!minionId) return

    setDrafts((prev) => {
      const minion = selectedMinions.find((item) => item.id === minionId)
      const current = normalizeConfig(minion, prev[minionId] ?? configs[minionId] ?? emptyConfig)
      const nextConfig = normalizeConfig(minion, updater(current))

      onUpdateConfig?.(minionId, nextConfig)
      return {
        ...prev,
        [minionId]: nextConfig,
      }
    })
  }

  const completionById = useMemo(() => {
    const map = {}
    selectedMinions.forEach((minion) => {
      const config = drafts[minion.id] || normalizeConfig(minion, emptyConfig)
      map[minion.id] = canAdvanceFromConfig(config)
    })
    return map
  }, [drafts, selectedMinions])

  const { completedCount, allComplete } = useMemo(() => {
    const count = selectedMinions.filter((minion) => {
      const config = drafts[minion.id] || normalizeConfig(minion, emptyConfig)
      return canAdvanceFromConfig(config)
    }).length

    return {
      completedCount: count,
      allComplete: selectedMinions.length > 0 && count === selectedMinions.length,
    }
  }, [drafts, selectedMinions])

  if (!selectedMinions.length) {
    return (
      <PageShell bg={ASSETS.strategyBg}>
        <PageTopBar back={<BackButton onClick={onBack} />} />
        <PageTitle
          title="Minion strategy"
          subtitle="No minions selected for this session."
          className={pageUi.titleBlock}
        />
        <p className={pageUi.metaText}>Go back and choose minions to continue.</p>
      </PageShell>
    )
  }

  const handleValidate = async () => {
    if (!activeMinion) return

    setValidateLoading(true)
    setValidateResult(null)

    try {
      const response = await validateStrategy({
        strategy: activeConfig.strategy ?? "",
      })

      const nextValidation = {
        ok: Boolean(response?.valid ?? response?.ok),
        message: response?.error ?? response?.message ?? null,
      }

      persistConfig(activeMinion.id, (current) => ({
        ...current,
        validationStatus: nextValidation,
      }))
      setValidateResult(nextValidation)
    } catch (error) {
      const nextValidation = {
        ok: false,
        message: error?.message || "Validation failed",
      }

      persistConfig(activeMinion.id, (current) => ({
        ...current,
        validationStatus: nextValidation,
      }))
      setValidateResult(nextValidation)
    } finally {
      setValidateLoading(false)
    }
  }

  const handleChange = (patch) => {
    if (!activeMinion) return

    persistConfig(activeMinion.id, (current) => {
      const nextConfig = { ...current, ...patch }

      if (Object.prototype.hasOwnProperty.call(patch, "strategy")) {
        nextConfig.validationStatus = null
      }

      return nextConfig
    })
  }

  const handleApplyTemplate = async (template) => {
    if (!activeMinion || !template?.strategy) return

    persistConfig(activeMinion.id, (current) => ({
      ...current,
      strategy: template.strategy,
      validationStatus: null,
    }))

    setValidateLoading(true)
    setValidateResult(null)

    try {
      const response = await validateStrategy({
        strategy: template.strategy,
      })

      const nextValidation = {
        ok: Boolean(response?.valid ?? response?.ok),
        message: response?.error ?? response?.message ?? null,
      }

      persistConfig(activeMinion.id, (current) => ({
        ...current,
        strategy: template.strategy,
        validationStatus: nextValidation,
      }))
      setValidateResult(nextValidation)
    } catch (error) {
      const nextValidation = {
        ok: false,
        message: error?.message || "Validation failed",
      }

      persistConfig(activeMinion.id, (current) => ({
        ...current,
        strategy: template.strategy,
        validationStatus: nextValidation,
      }))
      setValidateResult(nextValidation)
    } finally {
      setValidateLoading(false)
    }
  }

  const handlePrev = () => {
    setSelectedIndex((index) => Math.max(0, index - 1))
  }

  const handleNext = () => {
    if (!canAdvanceFromConfig(activeConfig)) {
      setValidateResult({
        ok: false,
        message: "Enter a name, a positive defense, and validate the strategy before continuing.",
      })
      return
    }

    setSelectedIndex((index) => Math.min(selectedMinions.length - 1, index + 1))
  }

  return (
    <PageShell bg={ASSETS.strategyBg} innerClassName="overflow-x-hidden">
      <div className="flex flex-1 flex-col items-center overflow-hidden ">
        <div className="w-full shrink-0">
          <PageTopBar
            back={<BackButton onClick={onBack} />}
            right={
              <p className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
                {completedCount}/{selectedMinions.length} complete
              </p>
            }
          />

          <PageTitle
            title="Minion strategy"
            subtitle="Configure each minion before battle."
            className={pageUi.titleBlock}
          />

          {setupErrorMessage ? (
            <div className="mb-4 w-full">
              <Panel
                title="Setup Error"
                className="border-rose-300/30 bg-rose-950/35"
                bodyClassName="text-sm leading-6 text-rose-100"
              >
                {setupErrorMessage}
              </Panel>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 w-full flex-1 overflow-hidden">
          <div
            className={cn(
              "grid h-full min-h-0 lg:grid-cols-[280px_1fr] lg:items-stretch",
              pageUi.mainGap
            )}
          >
            <Panel className="min-h-0 overflow-hidden" title="Minions">
              <MinionSidebar
                minions={selectedMinions}
                activeId={activeMinion?.id}
                completionById={completionById}
                onSelect={(id) => {
                  const index = selectedMinions.findIndex((minion) => minion.id === id)
                  if (index >= 0) setSelectedIndex(index)
                }}
              />
            </Panel>

            <Panel className="min-h-0 overflow-hidden" title="Strategy">
              <StrategyForm
                minion={activeMinion}
                value={activeConfig}
                templates={getTemplatesForMinion(activeMinion)}
                onApplyTemplate={handleApplyTemplate}
                onChange={handleChange}
                onPrev={handlePrev}
                onNext={handleNext}
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < selectedMinions.length - 1}
                onValidate={handleValidate}
                validateLoading={validateLoading}
                validateResult={validateResult ?? emptyValidation}
              />
            </Panel>
          </div>
        </div>
      </div>

      {allComplete && (
        <div className="mx-auto w-full max-w-[1100px] shrink-0 px-4 pb-6">
          <div className="flex w-full flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md sm:flex-row">
            <p className="text-center text-sm text-white/80 sm:text-left">
              All minions configured.
            </p>
            <Button variant="primary" type="button" onClick={() => onFinishAll?.()}>
              Continue to battle
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
