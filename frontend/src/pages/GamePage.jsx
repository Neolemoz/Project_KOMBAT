import { useEffect, useMemo, useRef, useState } from "react"
import GameTurnBanner from "../components/game/GameTurnBanner"
import HexBoard from "../components/game/HexBoard"
import SpawnModal from "../components/game/SpawnModal"
import { PageShell, BackButton, PageGameHeader } from "../components/layout"
import { ASSETS } from "../constants/assets"
import { createInitialBoardState } from "../utils/hexUtils"

const HEX_COST = 1000
const DEFAULT_BOARD_ZOOM = 0.74
const MIN_BOARD_ZOOM = 0.34
const MAX_BOARD_ZOOM = 2.8

function StatIcon({ kind }) {
  const shared = "h-4 w-4"

  if (kind === "mana") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
        <path d="M12 2 5 12l7 10 7-10-7-10Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 6.5 8.6 12 12 17.5 15.4 12 12 6.5Z" fill="currentColor" opacity="0.35" />
      </svg>
    )
  }

  if (kind === "units") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
        <circle cx="8" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 18.5c.8-2.7 2.7-4 5.2-4s4.4 1.3 5.2 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14.1 18c.5-1.9 1.9-3 3.9-3 1 0 1.8.2 2.5.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
        <path d="M12 20.2 4.7 12.8C2.8 11 2.8 8 4.7 6.2c1.8-1.8 4.8-1.8 6.6 0l.7.7.7-.7c1.8-1.8 4.8-1.8 6.6 0 1.8 1.8 1.8 4.8 0 6.6L12 20.2Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={shared} aria-hidden>
      <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function StatCard({ icon, label, value, valueClassName = "text-white" }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-md transition-all duration-200">
      <div className="flex items-center gap-3 text-slate-300">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.18)]">
          <StatIcon kind={icon} />
        </span>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">{label}</p>
      </div>
      <p className={`mt-3 text-2xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function BoardParticles() {
  const particles = [
    { left: "12%", top: "18%", size: "h-2 w-2", delay: "0s", duration: "4.8s" },
    { left: "82%", top: "24%", size: "h-1.5 w-1.5", delay: "1.2s", duration: "5.6s" },
    { left: "18%", top: "72%", size: "h-1.5 w-1.5", delay: "0.8s", duration: "6.2s" },
    { left: "86%", top: "70%", size: "h-2.5 w-2.5", delay: "2.1s", duration: "5.2s" },
    { left: "48%", top: "10%", size: "h-2 w-2", delay: "1.6s", duration: "6.8s" },
    { left: "58%", top: "84%", size: "h-1.5 w-1.5", delay: "0.4s", duration: "5.9s" },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, index) => (
        <span
          key={`board-particle-${index}`}
          className={`magic-particle absolute rounded-full bg-cyan-200/70 blur-[1px] ${particle.size}`}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            boxShadow: "0 0 14px rgba(103,232,249,0.45)",
          }}
        />
      ))}
      <span className="absolute left-[16%] top-[28%] h-24 w-24 rounded-full bg-cyan-300/8 blur-3xl" />
      <span className="absolute right-[14%] top-[58%] h-28 w-28 rounded-full bg-indigo-300/8 blur-3xl" />
    </div>
  )
}

function BuyHexModal({ open, hex, mana, onClose, onConfirm }) {
  if (!open || !hex) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.72)] px-4 backdrop-blur-[6px]">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-amber-300/20 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_rgba(8,15,32,0.96)_42%,_rgba(3,7,18,0.98)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-amber-200">
            Buy Territory
          </div>
          <h2 className="mt-4 text-3xl font-bold text-white">Confirm Hex Purchase</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Expand your territory by claiming this highlighted hex and unlock new adjacent cells.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected Hex</p>
            <p className="mt-2 text-2xl font-bold text-white">
              Row {hex.row}, Col {hex.col}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              This action will claim the neutral hex immediately.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Mana Cost</p>
            <p className="mt-2 text-4xl font-black text-amber-200">{HEX_COST}</p>
            <p className="mt-3 text-sm text-amber-50/85">Current mana: {mana}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={mana < HEX_COST}
            className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 shadow-[0_14px_35px_rgba(250,204,21,0.28)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  )
}

function PlayerStatusCard({
  player,
  label,
  active,
  mana,
  minionCount,
  totalHp,
  hexSpend,
  strategySpend,
  interestGain,
  recentMessages = [],
}) {
  return (
    <aside
      className={[
        "relative flex h-full min-h-[calc(100vh-13rem)] w-full max-w-[320px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-md transition-all duration-200",
        active
          ? "ring-1 ring-cyan-300/60 shadow-[0_0_40px_rgba(34,211,238,0.22),0_24px_80px_rgba(2,6,23,0.55)]"
          : "opacity-90 shadow-[0_24px_80px_rgba(2,6,23,0.4)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%)] opacity-70" />
      <div className={`pointer-events-none absolute inset-0 rounded-[32px] ${active ? "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_50%)]" : "bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_55%)]"}`} />
      <p className="relative z-10 text-xs uppercase tracking-[0.3em] text-cyan-100/70">
        {label ?? `Player ${player === "P1" ? "1" : "2"}`}
      </p>
      <p className="relative z-10 mt-3 text-[2.15rem] font-bold tracking-wide text-white">
        {active ? "Active Turn" : "Waiting"}
      </p>

      <div className="no-scrollbar relative z-10 mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto">
        <StatCard icon="mana" label="Mana" value={mana} valueClassName="text-cyan-100" />
        <StatCard icon="units" label="Units on Board" value={minionCount} valueClassName="text-white" />
        <StatCard icon="hp" label="Total HP" value={totalHp} valueClassName="text-emerald-200" />

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-md transition-all duration-200">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Hex Cost</p>
          <p className="mt-3 text-xl font-semibold text-amber-200">{hexSpend}</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-md transition-all duration-200">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Strategy Cost</p>
          <p className="mt-3 text-xl font-semibold text-rose-200">{strategySpend}</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-md transition-all duration-200">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Interest This Turn</p>
          <p className="mt-3 text-xl font-semibold text-emerald-200">{interestGain}</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-md transition-all duration-200">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Recent Actions</p>
          <div className="no-scrollbar mt-3 max-h-28 space-y-1 overflow-y-auto text-xs leading-5 text-slate-200">
            {recentMessages.length ? (
              recentMessages.map((message, index) => (
                <p key={`${player}-recent-${index}`}>{message}</p>
              ))
            ) : (
              <p className="text-slate-500">No recent actions</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

function clearSelections(board) {
  return Object.fromEntries(
    Object.entries(board).map(([key, cell]) => [key, { ...cell, isSelected: false }])
  )
}

function selectHex(board, selectedKey) {
  return Object.fromEntries(
    Object.entries(board).map(([key, cell]) => [
      key,
      { ...cell, isSelected: key === selectedKey },
    ])
  )
}

export default function GamePage({
  onBack,
  minionTypes = [],
  boardState,
  manaByPlayer,
  interestByPlayer,
  strategyCostByPlayer,
  totalHpByPlayer,
  turnActionLimits,
  battleLog = [],
  mode = "DUEL",
  onBuyHex,
  onSpawnMinion,
  onEndTurnServer,
  onBotTurnServer,
  syncedTurnNumber = 1,
  syncedActivePlayer = "P1",
}) {
  const boardViewportRef = useRef(null)
  const isDraggingBoardRef = useRef(false)
  const dragOriginRef = useRef({ x: 0, y: 0, left: 0, top: 0 })
  const hasCenteredBoardRef = useRef(false)
  const [selectedHex, setSelectedHex] = useState(null)
  const [pendingPurchaseHex, setPendingPurchaseHex] = useState(null)
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false)
  const [isResolvingTurn, setIsResolvingTurn] = useState(false)
  const [boardZoom, setBoardZoom] = useState(DEFAULT_BOARD_ZOOM)
  const [localBoardState, setLocalBoardState] = useState(() =>
    createInitialBoardState(8, 8, boardState)
  )
  const [localManaByPlayer, setLocalManaByPlayer] = useState(
    manaByPlayer ?? { P1: 0, P2: 0 }
  )
  const [localInterestByPlayer, setLocalInterestByPlayer] = useState(
    interestByPlayer ?? { P1: 0, P2: 0 }
  )
  const [hexSpendByPlayer, setHexSpendByPlayer] = useState({ P1: 0, P2: 0 })
  const turnNumber = syncedTurnNumber
  const activePlayer = syncedActivePlayer

  useEffect(() => {
    setLocalBoardState((current) => {
      const nextBoard = createInitialBoardState(8, 8, boardState)

      if (!current) {
        return nextBoard
      }

      return Object.fromEntries(
        Object.entries(nextBoard).map(([key, cell]) => [
          key,
          {
            ...cell,
            isSelected: Boolean(current[key]?.isSelected),
          },
        ])
      )
    })
  }, [boardState])

  useEffect(() => {
    setLocalManaByPlayer(manaByPlayer ?? { P1: 0, P2: 0 })
  }, [manaByPlayer])

  useEffect(() => {
    setLocalInterestByPlayer(interestByPlayer ?? { P1: 0, P2: 0 })
  }, [interestByPlayer])

  useEffect(() => {
    setSelectedHex(null)
    setPendingPurchaseHex(null)
    setIsSpawnModalOpen(false)
    setLocalBoardState((current) => clearSelections(current))
  }, [syncedActivePlayer])

  useEffect(() => {
    setHexSpendByPlayer({ P1: 0, P2: 0 })
  }, [syncedTurnNumber])

  const countsByPlayer = useMemo(() => {
    return Object.values(localBoardState).reduce(
      (acc, cell) => {
        if (cell.minion?.ownerId === 1 || cell.minion?.owner === "P1") acc.P1 += 1
        if (cell.minion?.ownerId === 2 || cell.minion?.owner === "P2") acc.P2 += 1
        return acc
      },
      { P1: 0, P2: 0 }
    )
  }, [localBoardState])

  const displayedManaByPlayer = useMemo(
    () => ({
      P1: Math.max(0, Number(localManaByPlayer.P1 ?? 0)),
      P2: Math.max(0, Number(localManaByPlayer.P2 ?? 0)),
    }),
    [localManaByPlayer]
  )

  const displayedStrategyCostByPlayer = useMemo(
    () => ({
      P1: Math.max(0, Number(strategyCostByPlayer?.P1 ?? 0)),
      P2: Math.max(0, Number(strategyCostByPlayer?.P2 ?? 0)),
    }),
    [strategyCostByPlayer]
  )
  const displayedTotalHpByPlayer = useMemo(
    () => ({
      P1: Math.max(0, Number(totalHpByPlayer?.P1 ?? 0)),
      P2: Math.max(0, Number(totalHpByPlayer?.P2 ?? 0)),
    }),
    [totalHpByPlayer]
  )
  const activeTurnActions = useMemo(
    () => turnActionLimits?.[activePlayer] ?? { boughtHex: false, spawned: false },
    [turnActionLimits, activePlayer]
  )
  const normalizedMode = String(mode ?? "DUEL").toUpperCase()
  const isSolitaireMode = normalizedMode === "SOLITAIRE"
  const isAutoMode = normalizedMode === "AUTO"
  const isBotTurn = (isSolitaireMode && activePlayer === "P2") || isAutoMode
  const boardSize = Math.round(47 * boardZoom)
  const boardGap = Math.max(4, Math.round(4 * boardZoom))
  const boardZoomDisplay = Math.round((boardZoom - DEFAULT_BOARD_ZOOM) * 100)

  const isFreeSpawnTurn = turnNumber === 1 && (countsByPlayer[activePlayer] ?? 0) === 0
  const mustSpawnBeforeEndTurn = turnNumber === 1 && (countsByPlayer[activePlayer] ?? 0) === 0
  const latestActionHighlight = useMemo(() => {
    const actionable = [...battleLog]
      .reverse()
      .find((entry) => ["move", "shoot", "spawn", "buy"].includes(entry?.actionType))

    if (!actionable) return null

    return {
      actionType: actionable.actionType,
      fromKey:
        actionable.fromRow && actionable.fromCol
          ? `${actionable.fromRow},${actionable.fromCol}`
          : null,
      toKey:
        actionable.toRow && actionable.toCol
          ? `${actionable.toRow},${actionable.toCol}`
          : null,
      targetKey:
        actionable.targetRow && actionable.targetCol
          ? `${actionable.targetRow},${actionable.targetCol}`
          : null,
    }
  }, [battleLog])
  const recentMessagesByPlayer = useMemo(() => {
    const actionable = battleLog.filter(
      (entry) =>
        ["buy", "spawn", "move", "shoot", "done"].includes(entry?.actionType) &&
        entry?.message
    )

    return {
      P1: actionable
        .filter((entry) => Number(entry?.playerId) === 1)
        .map((entry) => entry.message)
        .slice(-6),
      P2: actionable
        .filter((entry) => Number(entry?.playerId) === 2)
        .map((entry) => entry.message)
        .slice(-6),
    }
  }, [battleLog])

  useEffect(() => {
    if (!isBotTurn || isResolvingTurn) return undefined

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsResolvingTurn(true)
        setSelectedHex(null)
        setPendingPurchaseHex(null)
        setIsSpawnModalOpen(false)
        setLocalBoardState((current) => clearSelections(current))
        await onBotTurnServer?.()
      } catch (error) {
        console.error("Failed to run bot turn", error)
      } finally {
        setIsResolvingTurn(false)
      }
    }, 850)

    return () => window.clearTimeout(timeoutId)
  }, [isBotTurn, isResolvingTurn, onBotTurnServer])

  useEffect(() => {
    const viewport = boardViewportRef.current
    if (!viewport || hasCenteredBoardRef.current) return

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2)
    viewport.scrollTop = 0
    hasCenteredBoardRef.current = true
  }, [boardGap, boardSize])

  const handleConfirmBuyHex = async () => {
    const hex = pendingPurchaseHex
    if (!hex?.isBuyable) return
    if (isBotTurn) return
    if (activeTurnActions.boughtHex) return
    if ((displayedManaByPlayer[activePlayer] ?? 0) < HEX_COST) return

    try {
      const didBuy = await onBuyHex?.({ row: hex.row, col: hex.col })
      if (!didBuy) return
    } catch (error) {
      console.error("Failed to buy hex", error)
      return
    }

    setPendingPurchaseHex(null)
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setHexSpendByPlayer((current) => ({
      ...current,
      [activePlayer]: (current[activePlayer] ?? 0) + HEX_COST,
    }))
    setLocalBoardState((current) => clearSelections(current))
  }

  const handleRequestBuyHex = (hex) => {
    if (!hex?.isBuyable) return
    if (isBotTurn) return
    if (activeTurnActions.boughtHex) return
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setPendingPurchaseHex(hex)
    setLocalBoardState((current) => clearSelections(current))
  }

  const handleOpenSpawnModal = (hex) => {
    if (!hex) return
    if (isBotTurn) return
    if (hex.isOccupied) return
    if (hex.owner !== activePlayer) return
    if (activeTurnActions.spawned) return

    setPendingPurchaseHex(null)
    setSelectedHex({ row: hex.row, col: hex.col })
    setIsSpawnModalOpen(true)
    setLocalBoardState((current) => selectHex(current, `${hex.row},${hex.col}`))
  }

  const handleSpawnSelect = async (minionType) => {
    if (!selectedHex) return
    if (isBotTurn) return

    const spawnCost = isFreeSpawnTurn ? 0 : Number(minionType.price ?? 0)
    if ((displayedManaByPlayer[activePlayer] ?? 0) < spawnCost) return

    try {
      const didSpawn = await onSpawnMinion?.({
        minionType,
        owner: activePlayer,
        row: selectedHex.row,
        col: selectedHex.col,
        cost: spawnCost,
      })
      if (!didSpawn) return
    } catch (error) {
      console.error("Failed to spawn minion", error)
      return
    }

    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setLocalBoardState((current) => clearSelections(current))
  }

  const handleCloseModal = () => {
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setPendingPurchaseHex(null)
    setLocalBoardState((current) => clearSelections(current))
  }

  const handleEndTurn = async () => {
    if (isResolvingTurn) return
    if (isBotTurn) return
    if (mustSpawnBeforeEndTurn) return

    setIsResolvingTurn(true)
    setSelectedHex(null)
    setPendingPurchaseHex(null)
    setIsSpawnModalOpen(false)
    setLocalBoardState((current) => clearSelections(current))

    try {
      await onEndTurnServer?.()
    } catch (error) {
      console.error("Failed to sync end turn", error)
    } finally {
      setIsResolvingTurn(false)
    }
  }

  const applyBoardZoom = (nextZoom, pointer) => {
    const viewport = boardViewportRef.current
    const clampedZoom = Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, Number(nextZoom.toFixed(2))))

    if (!viewport) {
      setBoardZoom(clampedZoom)
      return
    }

    const previousZoom = boardZoom
    const rect = viewport.getBoundingClientRect()
    const offsetX = pointer ? pointer.clientX - rect.left : viewport.clientWidth / 2
    const offsetY = pointer ? pointer.clientY - rect.top : viewport.clientHeight / 2
    const contentX = viewport.scrollLeft + offsetX
    const contentY = viewport.scrollTop + offsetY
    const zoomRatio = clampedZoom / previousZoom

    setBoardZoom(clampedZoom)

    window.requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, contentX * zoomRatio - offsetX)
      viewport.scrollTop = Math.max(0, contentY * zoomRatio - offsetY)
    })
  }

  const handleBoardWheel = (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -0.12 : 0.12
    applyBoardZoom(boardZoom + direction, event)
  }

  const handleBoardDragStart = (event) => {
    if (event.button !== 0) return
    const viewport = boardViewportRef.current
    if (!viewport) return

    isDraggingBoardRef.current = true
    dragOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    }
    viewport.style.cursor = "grabbing"
  }

  const handleBoardDragMove = (event) => {
    if (!isDraggingBoardRef.current) return
    const viewport = boardViewportRef.current
    if (!viewport) return

    const deltaX = event.clientX - dragOriginRef.current.x
    const deltaY = event.clientY - dragOriginRef.current.y
    viewport.scrollLeft = dragOriginRef.current.left - deltaX
    viewport.scrollTop = dragOriginRef.current.top - deltaY
  }

  const handleBoardDragEnd = () => {
    const viewport = boardViewportRef.current
    isDraggingBoardRef.current = false
    if (viewport) viewport.style.cursor = "grab"
  }

  return (
    <PageShell
      bg={ASSETS.battleBg}
      maxWidthClass="max-w-[1900px]"
      innerClassName="min-h-0 overflow-hidden px-5 py-2 sm:px-6 sm:py-2"
    >
      <PageGameHeader
        back={
          onBack ? (
            <BackButton onClick={onBack} />
          ) : (
            <span className="inline-block w-10 sm:w-14" aria-hidden />
          )
        }
        center={
          <GameTurnBanner
            turnNumber={turnNumber}
            activePlayer={activePlayer}
          />
        }
        right={
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={isResolvingTurn || isBotTurn || mustSpawnBeforeEndTurn}
            className="rounded-2xl border border-orange-200/20 bg-[linear-gradient(135deg,_#fb923c_0%,_#ef4444_100%)] px-5 py-3 text-sm font-semibold tracking-[0.12em] text-white shadow-[0_14px_34px_rgba(239,68,68,0.38),0_0_20px_rgba(251,146,60,0.24)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_18px_44px_rgba(239,68,68,0.46),0_0_26px_rgba(251,146,60,0.32)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-orange-900/60 disabled:opacity-60"
          >
            {isResolvingTurn && isBotTurn ? "BOT PLAYING..." : isResolvingTurn ? "RESOLVING..." : "END TURN"}
          </button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_320px] gap-4 overflow-hidden">
        <PlayerStatusCard
          player="P1"
          label="Player 1"
          active={activePlayer === "P1"}
          mana={displayedManaByPlayer.P1}
          minionCount={countsByPlayer.P1}
          totalHp={displayedTotalHpByPlayer.P1}
          hexSpend={hexSpendByPlayer.P1}
          strategySpend={displayedStrategyCostByPlayer.P1}
          interestGain={localInterestByPlayer.P1}
          recentMessages={recentMessagesByPlayer.P1}
        />

        <main className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(74,222,255,0.08),_rgba(30,41,59,0.05)_38%,_rgba(2,6,23,0.18)_100%)] shadow-[0_32px_100px_rgba(2,6,23,0.34)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_18%_30%,_rgba(103,232,249,0.08),_transparent_22%),radial-gradient(circle_at_82%_72%,_rgba(129,140,248,0.12),_transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_44%,_rgba(2,6,23,0.28)_100%)]" />
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[32px] p-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/8 to-transparent" />
            <BoardParticles />
            <div className="pointer-events-none absolute right-2 top-2 z-20">
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(7,12,28,0.58)] px-1.5 py-1.5 shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur-md transition-all duration-200">
                <button
                  type="button"
                  onClick={() => applyBoardZoom(boardZoom - 0.1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
                  aria-label="Zoom out board"
                >
                  -
                </button>
                <span className="min-w-[3.6rem] text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
                  {boardZoomDisplay > 0 ? `+${boardZoomDisplay}%` : `${boardZoomDisplay}%`}
                </span>
                <button
                  type="button"
                  onClick={() => applyBoardZoom(boardZoom + 0.1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
                  aria-label="Zoom in board"
                >
                  +
                </button>
              </div>
            </div>

            <div
              ref={boardViewportRef}
              className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-auto"
              style={{ cursor: "grab" }}
              onWheel={handleBoardWheel}
              onMouseDown={handleBoardDragStart}
              onMouseMove={handleBoardDragMove}
              onMouseUp={handleBoardDragEnd}
              onMouseLeave={handleBoardDragEnd}
            >
              <div className="flex min-h-full min-w-full items-center justify-center px-6 pb-1 pt-1">
                <div className="flex items-center justify-center">
                  <HexBoard
                    rows={8}
                    cols={8}
                    boardState={localBoardState}
                    activePlayer={activePlayer}
                    actionHighlight={latestActionHighlight}
                    buyHex={handleRequestBuyHex}
                    spawnMinion={handleOpenSpawnModal}
                    size={boardSize}
                    gap={boardGap}
                    className="flex min-h-0 min-w-0 items-center justify-center"
                  />
                </div>
              </div>
            </div>

            <BuyHexModal
              open={Boolean(pendingPurchaseHex)}
              hex={pendingPurchaseHex}
              mana={displayedManaByPlayer[activePlayer]}
              onClose={handleCloseModal}
              onConfirm={handleConfirmBuyHex}
            />

            <SpawnModal
              open={isSpawnModalOpen}
              selectedHex={selectedHex}
              mana={displayedManaByPlayer[activePlayer]}
              minionTypes={minionTypes}
              isFreeSpawn={isFreeSpawnTurn}
              onClose={handleCloseModal}
              onSelectMinion={handleSpawnSelect}
            />
          </div>
        </main>

        <PlayerStatusCard
          player="P2"
          label={isSolitaireMode ? "Bot (Player 2)" : "Player 2"}
          active={activePlayer === "P2"}
          mana={displayedManaByPlayer.P2}
          minionCount={countsByPlayer.P2}
          totalHp={displayedTotalHpByPlayer.P2}
          hexSpend={hexSpendByPlayer.P2}
          strategySpend={displayedStrategyCostByPlayer.P2}
          interestGain={localInterestByPlayer.P2}
          recentMessages={recentMessagesByPlayer.P2}
        />
      </div>

    </PageShell>
  )
}
