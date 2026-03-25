import { useEffect, useMemo, useState } from "react"
import GameTurnBanner from "../components/game/GameTurnBanner"
import HexBoard from "../components/game/HexBoard"
import SpawnModal from "../components/game/SpawnModal"
import { PageShell, BackButton, PageGameHeader } from "../components/layout"
import { ASSETS } from "../constants/assets"
import {
  computeBuyableHexes,
  createInitialBoardState,
} from "../utils/hexUtils"

const HEX_COST = 5

function PlayerStatusCard({ player, active, mana, minionCount }) {
  return (
    <aside
      className={[
        "w-full max-w-[300px] rounded-3xl border border-white/10 bg-[rgba(5,10,24,0.88)] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition",
        active ? "ring-2 ring-cyan-300/60 shadow-[0_0_35px_rgba(34,211,238,0.2)]" : "opacity-80",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
        Player {player === "P1" ? "1" : "2"}
      </p>
      <p className="mt-2 text-3xl font-bold text-white">{active ? "Active Turn" : "Waiting"}</p>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mana</p>
          <p className="mt-2 text-2xl font-bold text-cyan-100">{mana}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units on Board</p>
          <p className="mt-2 text-lg font-semibold text-white">{minionCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hex Cost</p>
          <p className="mt-2 text-lg font-semibold text-amber-200">{HEX_COST}</p>
        </div>
      </div>
    </aside>
  )
}

export default function GamePage({
  onBack,
  minionTypes = [],
  boardState,
  manaByPlayer,
  onSpawnMinion,
}) {
  const [turnNumber, setTurnNumber] = useState(1)
  const [activePlayer, setActivePlayer] = useState("P1")
  const [selectedHex, setSelectedHex] = useState(null)
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false)
  const [localBoardState, setLocalBoardState] = useState(() =>
    computeBuyableHexes(createInitialBoardState(8, 8, boardState), "P1")
  )
  const [localManaByPlayer, setLocalManaByPlayer] = useState(
    manaByPlayer ?? { P1: 30, P2: 30 }
  )

  useEffect(() => {
    setLocalBoardState(
      computeBuyableHexes(createInitialBoardState(8, 8, boardState), "P1")
    )
    setLocalManaByPlayer(manaByPlayer ?? { P1: 30, P2: 30 })
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
  }, [boardState, manaByPlayer])

  const countsByPlayer = useMemo(() => {
    return Object.values(localBoardState).reduce(
      (acc, cell) => {
        if (cell.minion?.owner === "P1") acc.P1 += 1
        if (cell.minion?.owner === "P2") acc.P2 += 1
        return acc
      },
      { P1: 0, P2: 0 }
    )
  }, [localBoardState])

  const handleBuyHex = (hex) => {
    if ((localManaByPlayer[activePlayer] ?? 0) < HEX_COST) return

    setLocalManaByPlayer((current) => ({
      ...current,
      [activePlayer]: current[activePlayer] - HEX_COST,
    }))

    setLocalBoardState((current) => {
      const key = `${hex.row},${hex.col}`
      const next = {
        ...current,
        [key]: {
          ...current[key],
          owner: activePlayer,
          isSpawnable: true,
          isBuyable: false,
          isSelected: false,
        },
      }
      return computeBuyableHexes(next, activePlayer)
    })
  }

  const handleHexClick = (hex) => {
    if (hex.isOccupied) return

    if (hex.isSpawnable && hex.owner === activePlayer) {
      const key = `${hex.row},${hex.col}`
      setSelectedHex({ row: hex.row, col: hex.col })
      setLocalBoardState((current) =>
        Object.fromEntries(
          Object.entries(current).map(([cellKey, cell]) => [
            cellKey,
            { ...cell, isSelected: cellKey === key },
          ])
        )
      )
      setIsSpawnModalOpen(true)
      return
    }

    if (hex.isBuyable) {
      handleBuyHex(hex)
    }
  }

  const handleSpawnSelect = (minionType) => {
    if (!selectedHex) return
    if ((localManaByPlayer[activePlayer] ?? 0) < minionType.price) return

    const didSpawn = onSpawnMinion?.({
      minionType,
      owner: activePlayer,
      row: selectedHex.row,
      col: selectedHex.col,
    })

    if (didSpawn === false) return

    const spawnedMinion = {
      id: `${minionType.id}-${activePlayer}-${Date.now()}`,
      typeId: minionType.typeId ?? minionType.id,
      name: minionType.name,
      defense: minionType.defense,
      strategy: minionType.strategy,
      hp: 100,
      owner: activePlayer,
      row: selectedHex.row,
      col: selectedHex.col,
    }

    setLocalManaByPlayer((current) => ({
      ...current,
      [activePlayer]: current[activePlayer] - minionType.price,
    }))

    setLocalBoardState((current) => {
      const key = `${selectedHex.row},${selectedHex.col}`
      const next = {
        ...current,
        [key]: {
          ...current[key],
          owner: activePlayer,
          isSpawnable: true,
          isOccupied: true,
          isSelected: false,
          minion: spawnedMinion,
        },
      }
      return computeBuyableHexes(next, activePlayer)
    })

    setSelectedHex(null)
    setIsSpawnModalOpen(false)
  }

  const handleCloseModal = () => {
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setLocalBoardState((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, cell]) => [key, { ...cell, isSelected: false }])
      )
    )
  }

  const handleEndTurn = () => {
    setSelectedHex(null)
    setIsSpawnModalOpen(false)
    setLocalBoardState((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, cell]) => [key, { ...cell, isSelected: false }])
      )
    )
    setActivePlayer((current) => {
      const nextPlayer = current === "P1" ? "P2" : "P1"
      setLocalBoardState((board) => computeBuyableHexes(board, nextPlayer))
      if (current === "P2") {
        setTurnNumber((value) => value + 1)
      }
      return nextPlayer
    })
  }

  return (
    <PageShell
      bg={ASSETS.battleBg}
      maxWidthClass="max-w-[1800px]"
      innerClassName="min-h-0 overflow-hidden py-4 sm:py-4"
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

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(180px,280px)_1fr_minmax(180px,280px)] gap-4 overflow-hidden">
        <PlayerStatusCard
          player="P1"
          active={activePlayer === "P1"}
          mana={localManaByPlayer.P1}
          minionCount={countsByPlayer.P1}
        />

        <main className="relative flex min-h-0 items-center justify-center overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />

          <div className="relative flex h-full w-full max-w-[1360px] items-center justify-center rounded-[32px] border border-white/10 bg-[rgba(4,8,22,0.58)] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <HexBoard
              rows={8}
              cols={8}
              boardState={localBoardState}
              activePlayer={activePlayer}
              onHexClick={handleHexClick}
              className="h-full w-full"
            />

            <SpawnModal
              open={isSpawnModalOpen}
              selectedHex={selectedHex}
              mana={localManaByPlayer[activePlayer]}
              minionTypes={minionTypes}
              onClose={handleCloseModal}
              onSelectMinion={handleSpawnSelect}
            />
          </div>
        </main>

        <PlayerStatusCard
          player="P2"
          active={activePlayer === "P2"}
          mana={localManaByPlayer.P2}
          minionCount={countsByPlayer.P2}
        />
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-3 text-center backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hex States</p>
          <p className="mt-2 text-sm text-white/80">
            Green = spawnable, yellow = buyable, cyan = selected, occupied hexes show unit HP.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEndTurn}
          className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-600"
        >
          END TURN
        </button>
      </div>
    </PageShell>
  )
}
