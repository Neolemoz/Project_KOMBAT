import { useMemo, useState } from "react"
import HomePage from "./pages/Home"
import ModeSelectPage from "./pages/ModeSelectPage"
import MinionTypePage from "./pages/MinionTypePage"
import ChooseMinionPage from "./pages/ChooseMinionPage"
import MinionStrategyPage from "./pages/MinionStrategyPage"
import GamePage from "./pages/GamePage"
import { FLOW } from "./constants/flow"
import { PageShell, PageTitle } from "./components/layout"
import { Button } from "./components/ui/Button"
import { ASSETS } from "./constants/assets"
import { pageUi } from "./constants/pageUi"

function createEmptyBoard(rows = 8, cols = 8) {
  const cells = {}
  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      cells[`${row},${col}`] = { row, col, minion: null }
    }
  }
  return cells
}

export default function App() {
  const [page, setPage] = useState(FLOW.HOME)
  const [mode, setMode] = useState(null)
  const [minionType, setMinionType] = useState(null)
  const [selectedMinions, setSelectedMinions] = useState([])
  const [configsByMinionId, setConfigsByMinionId] = useState({})
  const [minionConfigs, setMinionConfigs] = useState(null)
  const [manaByPlayer, setManaByPlayer] = useState({ P1: 30, P2: 30 })
  const [boardState, setBoardState] = useState(() => createEmptyBoard())

  const updateConfig = (minionId, patch) => {
    setConfigsByMinionId((prev) => {
      const current = prev[minionId] || {}
      return {
        ...prev,
        [minionId]: { ...current, ...patch },
      }
    })
  }

  const minionTypes = useMemo(() => {
    return (minionConfigs ?? []).map((minion) => ({
      id: minion.id,
      typeId: minion.id,
      name: minion.config?.name?.trim() || minion.label,
      defense: Number(minion.config?.defense) || 0,
      strategy: minion.config?.strategy?.trim() || "",
      price: 10,
    }))
  }, [minionConfigs])

  const handleSpawn = ({ minionType: type, owner, row, col }) => {
    const price = Number(type?.price ?? 0)
    const key = `${row},${col}`
    const targetCell = boardState[key]

    if (!type || !targetCell || targetCell.minion) return false
    if ((manaByPlayer[owner] ?? 0) < price) return false

    const minion = {
      id: `${type.id}-${owner}-${Date.now()}`,
      typeId: type.typeId ?? type.id,
      name: type.name,
      defense: type.defense,
      strategy: type.strategy,
      hp: 100,
      owner,
      row,
      col,
    }

    setManaByPlayer((current) => ({
      ...current,
      [owner]: current[owner] - price,
    }))
    setBoardState((current) => ({
      ...current,
      [key]: { ...current[key], minion },
    }))
    return true
  }

  if (page === FLOW.HOME) {
    return <HomePage onStart={() => setPage(FLOW.MODE)} />
  }

  if (page === FLOW.MODE) {
    return (
      <ModeSelectPage
        onBack={() => setPage(FLOW.HOME)}
        onSelectMode={(modeKey) => {
          setMode(modeKey)
          setPage(FLOW.MINION_TYPE)
        }}
      />
    )
  }

  if (page === FLOW.MINION_TYPE) {
    return (
      <MinionTypePage
        onBack={() => setPage(FLOW.MODE)}
        onConfirm={(type) => {
          setMinionType(type)
          setPage(FLOW.MINION_SELECT)
        }}
      />
    )
  }

  if (page === FLOW.MINION_SELECT) {
    return (
      <ChooseMinionPage
        minionType={minionType}
        onBack={() => setPage(FLOW.MINION_TYPE)}
        onContinue={(payload) => {
          setSelectedMinions(payload.selectedMinions)
          setConfigsByMinionId({})
          setMinionConfigs(null)
          setManaByPlayer({ P1: 30, P2: 30 })
          setBoardState(createEmptyBoard())
          setPage(FLOW.MINION_STRATEGY)
        }}
      />
    )
  }

  if (page === FLOW.MINION_STRATEGY) {
    return (
      <MinionStrategyPage
        selectedMinions={selectedMinions}
        configs={configsByMinionId}
        onUpdateConfig={updateConfig}
        onBack={() => setPage(FLOW.MINION_SELECT)}
        onFinishAll={() => {
          const payload = selectedMinions.map((minion) => ({
            id: minion.id,
            label: minion.label,
            imageUrl: minion.imageUrl,
            config: configsByMinionId[minion.id],
          }))
          setMinionConfigs(payload)
          setBoardState(createEmptyBoard())
          setManaByPlayer({ P1: 30, P2: 30 })
          setPage(FLOW.GAME)
        }}
      />
    )
  }

  if (page === FLOW.GAME) {
    return (
      <GamePage
        onBack={() => setPage(FLOW.MINION_STRATEGY)}
        minionTypes={minionTypes}
        boardState={boardState}
        manaByPlayer={manaByPlayer}
        onSpawnMinion={handleSpawn}
      />
    )
  }

  return (
    <PageShell
      bg={ASSETS.homeBg}
      innerClassName="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center"
    >
      <PageTitle
        title="Something went wrong"
        subtitle="Unknown screen state."
        className={pageUi.titleBlock}
      />
      <Button variant="primary" type="button" onClick={() => setPage(FLOW.HOME)}>
        Go home
      </Button>
    </PageShell>
  )
}
