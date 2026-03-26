import { useEffect, useMemo, useState } from "react"
import GameTurnBanner from "../components/game/GameTurnBanner"
import HexBoard from "../components/game/HexBoard"
import SpawnModal from "../components/game/SpawnModal"
import { PageShell, BackButton, PageGameHeader } from "../components/layout"
import { ASSETS } from "../constants/assets"
import { createInitialBoardState } from "../utils/hexUtils"

const HEX_COST = 1000

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
        "flex h-full min-h-0 w-full max-w-[260px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(5,10,24,0.88)] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition",
        active ? "ring-2 ring-cyan-300/60 shadow-[0_0_35px_rgba(34,211,238,0.2)]" : "opacity-80",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
        {label ?? `Player ${player === "P1" ? "1" : "2"}`}
      </p>
      <p className="mt-2 text-[2rem] font-bold text-white">{active ? "Active Turn" : "Waiting"}</p>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mana</p>
          <p className="mt-2 text-2xl font-bold text-cyan-100">{mana}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units on Board</p>
          <p className="mt-2 text-lg font-semibold text-white">{minionCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total HP</p>
          <p className="mt-2 text-lg font-semibold text-emerald-200">{totalHp}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hex Cost</p>
          <p className="mt-2 text-lg font-semibold text-amber-200">{hexSpend}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Strategy Cost</p>
          <p className="mt-2 text-lg font-semibold text-rose-200">{strategySpend}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Interest This Turn</p>
          <p className="mt-2 text-lg font-semibold text-emerald-200">{interestGain}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent Actions</p>
          <div className="mt-2 max-h-28 space-y-1 overflow-y-auto pr-1 text-xs leading-5 text-slate-200">
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
  const [selectedHex, setSelectedHex] = useState(null)
  const [pendingPurchaseHex, setPendingPurchaseHex] = useState(null)
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false)
  const [isResolvingTurn, setIsResolvingTurn] = useState(false)
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
  const modeLabel =
    isAutoMode ? "Auto" : isSolitaireMode ? "Solitaire" : "Duel"
  const isBotTurn = (isSolitaireMode && activePlayer === "P2") || isAutoMode

  const isFreeSpawnTurn = turnNumber === 1 && (countsByPlayer[activePlayer] ?? 0) === 0
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
        center={<GameTurnBanner turnNumber={turnNumber} activePlayer={activePlayer} />}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_240px] gap-3 overflow-hidden">
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

        <main className="relative flex min-h-0 items-center justify-center overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />
          <BoardParticles />

          <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(4,8,22,0.58)] p-3 sm:p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <HexBoard
              rows={8}
              cols={8}
              boardState={localBoardState}
              activePlayer={activePlayer}
              actionHighlight={latestActionHighlight}
              buyHex={handleRequestBuyHex}
              spawnMinion={handleOpenSpawnModal}
              className="flex h-full w-full min-h-0 min-w-0 items-center justify-center"
            />

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

      <div className="mt-3 grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-center backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hex States</p>
          <p className="mt-1 text-sm text-white/80">
            Green = spawnable, yellow = buyable, occupied hexes show unit HP.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-cyan-200/80">
            Mode: {modeLabel}
            {isSolitaireMode ? " · Bot resolves Player 2 automatically." : ""}
            {isAutoMode ? " · Both players are controlled by bots." : ""}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            Buy: {activeTurnActions.boughtHex ? "used" : "available"} · Spawn: {activeTurnActions.spawned ? "used" : "available"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={isResolvingTurn || isBotTurn}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-900/60"
          >
            {isResolvingTurn && isBotTurn ? "BOT PLAYING..." : isResolvingTurn ? "RESOLVING..." : "END TURN"}
          </button>
        </div>
      </div>

    </PageShell>
  )
}
