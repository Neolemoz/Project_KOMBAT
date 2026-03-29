import { useEffect, useMemo, useState } from "react"
import HomePage from "./pages/Home"
import ModeSelectPage from "./pages/ModeSelectPage"
import MinionTypePage from "./pages/MinionTypePage"
import ChooseMinionPage from "./pages/ChooseMinionPage"
import MinionStrategyPage from "./pages/MinionStrategyPage"
import GamePage from "./pages/GamePage"
import EndgamePage from "./pages/EndgamePage"
import RulesPage from "./pages/RulesPage"
import { FLOW } from "./constants/flow"
import { PageShell, PageTitle } from "./components/layout"
import { Button } from "./components/ui/Button"
import { ASSETS } from "./constants/assets"
import { pageUi } from "./constants/pageUi"
import { apiFetch } from "./api/client"

const QUICK_START_MINIONS = [
  {
    id: "vanguard",
    label: "Vanguard",
    imageUrl: "",
    config: {
      name: "RAN",
      defense: 12,
      attack: 14,
      strategyId: "frontline",
      strategy: [
        "loc = opponent",
        "dir = loc % 10",
        "if (loc / 10 - 1) then {",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then move upleft else move downleft",
        "        } else move down",
        "      } else move downright",
        "    } else move upright",
        "  } else move up",
        "} else if (loc) then {",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then shoot upleft 18 else shoot downleft 18",
        "        } else shoot down 18",
        "      } else shoot downright 18",
        "    } else shoot upright 18",
        "  } else shoot up 18",
        "} else {",
        "  dir = random % 6 + 1",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then move upleft else move downleft",
        "        } else move down",
        "      } else move downright",
        "    } else move upright",
        "  } else move up",
        "}",
      ].join("\n"),
    },
  },
  {
    id: "ranger",
    label: "Ranger",
    imageUrl: "",
    config: {
      name: "VAN",
      defense: 8,
      attack: 18,
      strategyId: "hunter",
      strategy: [
        "loc = opponent",
        "dir = loc % 10",
        "if (loc / 10 - 1) then {",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then move upleft else move downleft",
        "        } else move down",
        "      } else move downright",
        "    } else move upright",
        "  } else move up",
        "} else if (loc) then {",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then shoot upleft 22 else shoot downleft 22",
        "        } else shoot down 22",
        "      } else shoot downright 22",
        "    } else shoot upright 22",
        "  } else shoot up 22",
        "} else {",
        "  dir = random % 6 + 1",
        "  if ((dir - 1) ^ 2) then {",
        "    if ((dir - 2) ^ 2) then {",
        "      if ((dir - 3) ^ 2) then {",
        "        if ((dir - 4) ^ 2) then {",
        "          if ((dir - 5) ^ 2) then move upleft else move downleft",
        "        } else move down",
        "      } else move downright",
        "    } else move upright",
        "  } else move up",
        "}",
      ].join("\n"),
    },
  },
]

const SPAWN_COST = 100

function createEmptyBoard(rows = 8, cols = 8) {
  const cells = {}
  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      cells[`${row},${col}`] = {
        row,
        col,
        owner: null,
        isSpawnable: false,
        isBuyable: false,
        isOccupied: false,
        minion: null,
      }
    }
  }
  return cells
}

function toOwnerLabel(ownerId) {
  if (Number(ownerId) === 1) return "P1"
  if (Number(ownerId) === 2) return "P2"
  return null
}

function mergeServerBoardOwnership(currentBoard, serverBoard) {
  const nextBoard = { ...currentBoard }

  Object.entries(serverBoard ?? {}).forEach(([rowKey, rowMap]) => {
    Object.entries(rowMap ?? {}).forEach(([colKey, hex]) => {
      const key = `${rowKey},${colKey}`
      const currentCell = nextBoard[key] ?? { row: Number(rowKey), col: Number(colKey), minion: null }
      const minion = hex?.occupant ?? hex?.minion ?? null
      nextBoard[key] = {
        ...currentCell,
        row: Number(rowKey),
        col: Number(colKey),
        owner: toOwnerLabel(hex?.ownerId),
        isSpawnable: Boolean(hex?.spawnable ?? hex?.ownerId),
        isBuyable: Boolean(hex?.buyable),
        isOccupied: Boolean(minion),
        minion,
      }
    })
  })

  return nextBoard
}

export default function App() {
  const [page, setPage] = useState(FLOW.HOME)
  const [mode, setMode] = useState(null)
  const [minionType, setMinionType] = useState(null)
  const [selectedMinions, setSelectedMinions] = useState([])
  const [configsByMinionId, setConfigsByMinionId] = useState({})
  const [minionConfigs, setMinionConfigs] = useState(null)
  const [manaByPlayer, setManaByPlayer] = useState({ P1: 0, P2: 0 })
  const [boardState, setBoardState] = useState(() => createEmptyBoard())
  const [serverTurnNumber, setServerTurnNumber] = useState(1)
  const [serverActivePlayer, setServerActivePlayer] = useState("P1")
  const [battleLog, setBattleLog] = useState([])
  const [strategyCostByPlayer, setStrategyCostByPlayer] = useState({ P1: 0, P2: 0 })
  const [totalHpByPlayer, setTotalHpByPlayer] = useState({ P1: 0, P2: 0 })
  const [turnActionLimits, setTurnActionLimits] = useState({
    P1: { boughtHex: false, spawned: false },
    P2: { boughtHex: false, spawned: false },
  })
  const [gameResult, setGameResult] = useState({
    gameOver: false,
    winner: 0,
    turnNumber: 1,
    summary: {
      P1: { units: 0, hp: 0, budget: 0 },
      P2: { units: 0, hp: 0, budget: 0 },
    },
  })
  const [interestByPlayer, setInterestByPlayer] = useState({
    P1: 0,
    P2: 0,
  })
  const [setupErrorMessage, setSetupErrorMessage] = useState(null)

  const applyServerGameState = (gameState) => {
    if (!gameState) return

    const players = gameState.players ?? {}
    const interest = gameState.interestByPlayer ?? {}
    const strategyCost = gameState.strategyCostByPlayer ?? {}
    const boughtHex = gameState.boughtHexThisTurn ?? {}
    const spawned = gameState.spawnedThisTurn ?? {}
    const p1Budget = Math.floor(Number(players["1"]?.budget ?? players[1]?.budget ?? 0))
    const p2Budget = Math.floor(Number(players["2"]?.budget ?? players[2]?.budget ?? 0))

    setManaByPlayer({ P1: p1Budget, P2: p2Budget })
    setInterestByPlayer({
      P1: Math.floor(Number(interest["1"] ?? interest[1] ?? 0)),
      P2: Math.floor(Number(interest["2"] ?? interest[2] ?? 0)),
    })
    setStrategyCostByPlayer({
      P1: Math.floor(Number(strategyCost["1"] ?? strategyCost[1] ?? 0)),
      P2: Math.floor(Number(strategyCost["2"] ?? strategyCost[2] ?? 0)),
    })
    setTotalHpByPlayer({
      P1: Math.max(0, Number(players["1"]?.totalHp ?? players[1]?.totalHp ?? 0)),
      P2: Math.max(0, Number(players["2"]?.totalHp ?? players[2]?.totalHp ?? 0)),
    })
    setTurnActionLimits({
      P1: {
        boughtHex: Boolean(boughtHex["1"] ?? boughtHex[1] ?? false),
        spawned: Boolean(spawned["1"] ?? spawned[1] ?? false),
      },
      P2: {
        boughtHex: Boolean(boughtHex["2"] ?? boughtHex[2] ?? false),
        spawned: Boolean(spawned["2"] ?? spawned[2] ?? false),
      },
    })
    setBoardState((current) => mergeServerBoardOwnership(current, gameState.board ?? {}))
    setServerTurnNumber(Number(gameState.turnCount ?? 1))
    setServerActivePlayer(Number(gameState.currentPlayerId ?? 1) === 2 ? "P2" : "P1")
    setBattleLog(Array.isArray(gameState.battleLog) ? gameState.battleLog : [])
    setGameResult({
      gameOver: Boolean(gameState.gameOver),
      winner: Number(gameState.winner ?? 0),
      turnNumber: Number(gameState.turnCount ?? 1),
      summary: {
        P1: {
          units: Number(players["1"]?.aliveMinionCount ?? players[1]?.aliveMinionCount ?? 0),
          hp: Number(players["1"]?.totalHp ?? players[1]?.totalHp ?? 0),
          budget: p1Budget,
        },
        P2: {
          units: Number(players["2"]?.aliveMinionCount ?? players[2]?.aliveMinionCount ?? 0),
          hp: Number(players["2"]?.totalHp ?? players[2]?.totalHp ?? 0),
          budget: p2Budget,
        },
      },
    })

    if (Boolean(gameState.gameOver)) {
      setPage(FLOW.ENDGAME)
    }
  }

  const minionTypes = useMemo(() => {
    const sourceMinions = minionConfigs ?? QUICK_START_MINIONS

    return sourceMinions.map((minion) => ({
      id: minion.id,
      typeId: minion.id,
      name: minion.config?.name?.trim() || minion.label,
      imageUrl: minion.imageUrl || "",
      defense: Number(minion.config?.defense) || 0,
      attack: Number(minion.config?.attack) || 10,
      strategyId: minion.config?.strategyId ?? minion.id,
      strategy: minion.config?.strategy?.trim() || "",
      price: SPAWN_COST,
    }))
  }, [minionConfigs])

  useEffect(() => {
    let cancelled = false

    async function startBackendGame() {
      if (page !== FLOW.GAME) return

      try {
        setSetupErrorMessage(null)
        const gameState = await apiFetch("/api/start", {
          method: "POST",
          body: JSON.stringify({
            mode: (mode ?? "duel").toLowerCase(),
          }),
        })

        await handleRegisterMinionTypes(minionTypes)

        if (!cancelled) {
          applyServerGameState(gameState)
        }
      } catch (error) {
        console.error("Failed to start backend game", error)
        if (!cancelled) {
          setSetupErrorMessage(
            error?.message || "Failed to prepare the battle. Please review your minion setup and try again."
          )
          setPage(FLOW.MINION_STRATEGY)
        }
      }
    }

    startBackendGame()

    return () => {
      cancelled = true
    }
  }, [page, mode, minionTypes])

  const handleServerEndTurn = async () => {
    const gameState = await apiFetch("/api/endturn", {
      method: "POST",
    })
    applyServerGameState(gameState)
    return gameState
  }

  const handleRegisterMinionTypes = async (types) => {
    const seen = new Set()
    const uniqueTypes = (types ?? []).filter((type) => {
      const name = String(type?.name ?? "").trim()
      if (!name || seen.has(name)) return false
      seen.add(name)
      return true
    })

    for (const type of uniqueTypes) {
      const didRegister = await apiFetch("/api/minion_type", {
        method: "POST",
        body: JSON.stringify({
          name: type.name,
          hp: 100,
          defense: Number(type.defense ?? 0),
          script: type.strategy ?? "",
        }),
      })

      if (!didRegister) {
        throw new Error(
          `Failed to register minion type "${type.name}". Please revalidate its strategy and try again.`
        )
      }
    }
  }

  const handleServerBotTurn = async () => {
    const gameState = await apiFetch("/api/bot-turn", {
      method: "POST",
    })
    applyServerGameState(gameState)
    return gameState
  }

  const handleServerBuyHex = async ({ row, col }) => {
    const gameState = await apiFetch("/api/buy", {
      method: "POST",
      body: JSON.stringify({ row, col }),
    })
    applyServerGameState(gameState)
    const ownerId = Number(gameState?.board?.[row]?.[col]?.ownerId ?? 0)
    const activePlayerId = Number(gameState?.currentPlayerId ?? 0)
    return ownerId !== 0 && ownerId === activePlayerId
  }

  const handleServerSpawn = async ({ minionType: type, owner, row, col, cost }) => {
    const budget = Number(manaByPlayer?.[owner] ?? 0)
    const price = Number(cost ?? type?.price ?? 0)

    if (!type || budget < price) {
      return false
    }

    const gameState = await apiFetch("/api/spawn", {
      method: "POST",
      body: JSON.stringify({
        row,
        col,
        name: type.name,
        defense: Number(type.defense ?? 0),
        strategy: type.strategy ?? "",
      }),
    })

    applyServerGameState(gameState)
    const spawnedMinion =
      gameState?.board?.[row]?.[col]?.occupant ?? gameState?.board?.[row]?.[col]?.minion ?? null

    return Boolean(spawnedMinion)
  }

  const updateConfig = (minionId, patch) => {
    setConfigsByMinionId((prev) => {
      const current = prev[minionId] || {}
      return {
        ...prev,
        [minionId]: { ...current, ...patch },
      }
    })
  }

  const resetResultState = () => {
    setGameResult({
      gameOver: false,
      winner: 0,
      turnNumber: 1,
      summary: {
        P1: { units: 0, hp: 0, budget: 0 },
        P2: { units: 0, hp: 0, budget: 0 },
      },
    })
  }

  const handlePlayAgain = () => {
    setSetupErrorMessage(null)
    resetResultState()
    setBoardState(createEmptyBoard())
    setManaByPlayer({ P1: 0, P2: 0 })
    setInterestByPlayer({ P1: 0, P2: 0 })
    setStrategyCostByPlayer({ P1: 0, P2: 0 })
    setTotalHpByPlayer({ P1: 0, P2: 0 })
    setTurnActionLimits({
      P1: { boughtHex: false, spawned: false },
      P2: { boughtHex: false, spawned: false },
    })
    setBattleLog([])
    setServerTurnNumber(1)
    setServerActivePlayer("P1")
    setPage(FLOW.GAME)
  }

  const handleGoHome = () => {
    setSetupErrorMessage(null)
    resetResultState()
    setPage(FLOW.HOME)
  }

  const handleSpawn = ({ minionType: type, owner, row, col, cost }) => {
    const price = Number(cost ?? type?.price ?? 0)
    const key = `${row},${col}`
    const targetCell = boardState[key]

    if (!type || !targetCell || targetCell.minion) return false
    if ((manaByPlayer[owner] ?? 0) < price) return false

    const minion = {
      id: `${type.id}-${owner}-${Date.now()}`,
      typeId: type.typeId ?? type.id,
      name: type.name,
      defense: type.defense,
      attack: Number(type.attack ?? 10),
      strategyId: type.strategyId ?? type.typeId ?? type.id,
      strategy: type.strategy,
      hp: 100,
      owner,
      row,
      col,
      createdAt: Date.now(),
    }

    setBoardState((current) => ({
      ...current,
      [key]: { ...current[key], minion },
    }))
    return true
  }

  if (page === FLOW.HOME) {
    return <HomePage onStart={() => setPage(FLOW.MODE)} onRules={() => setPage(FLOW.RULES)} />
  }

  if (page === FLOW.RULES) {
    return <RulesPage onBack={() => setPage(FLOW.HOME)} />
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
          setSetupErrorMessage(null)
          setManaByPlayer({ P1: 0, P2: 0 })
          setBoardState(createEmptyBoard())
          resetResultState()
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
        setupErrorMessage={setupErrorMessage}
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
          setSetupErrorMessage(null)
          setBoardState(createEmptyBoard())
          setManaByPlayer({ P1: 0, P2: 0 })
          resetResultState()
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
        interestByPlayer={interestByPlayer}
        strategyCostByPlayer={strategyCostByPlayer}
        totalHpByPlayer={totalHpByPlayer}
        turnActionLimits={turnActionLimits}
        battleLog={battleLog}
        mode={mode}
        onBuyHex={handleServerBuyHex}
        onSpawnMinion={handleServerSpawn}
        onEndTurnServer={handleServerEndTurn}
        onBotTurnServer={handleServerBotTurn}
        syncedTurnNumber={serverTurnNumber}
        syncedActivePlayer={serverActivePlayer}
      />
    )
  }

  if (page === FLOW.ENDGAME) {
    return (
      <EndgamePage
        winner={gameResult.winner}
        turnNumber={gameResult.turnNumber}
        summary={gameResult.summary}
        onPlayAgain={handlePlayAgain}
        onHome={handleGoHome}
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
