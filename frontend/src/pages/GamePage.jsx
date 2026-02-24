import { useMemo, useState } from "react"
import BoardSVG from "../components/BoardSVG"
import { getGameState, endTurn, buyHex, spawnMinion } from "../api/gameApi"

function buildEmptyBoard(rows = 8, cols = 8) {
    const map = new Map()
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            map.set(`${r},${c}`, { owner: null, unit: null })
        }
    }
    return map
}

function getSpawnZone(player) {
    if (player === "P1") {
        return new Set(["1,1", "1,2", "1,3", "2,1", "2,2"])
    }
    return new Set(["8,8", "8,7", "8,6", "7,8", "7,7"])
}

function isInSpawnZone(player, row, col) {
    return getSpawnZone(player).has(`${row},${col}`)
}

function HeaderBar({ turnNumber, activePlayer }) {
    const theme =
        activePlayer === "P1" ? "arcane-pill--cyan" : "arcane-pill--crimson"

    return (
        <div className="w-full flex items-center justify-center pt-8">
            <div className={`arcane-pill arcane-header ${theme}`}>
                <div className="arcane-header-text text-lg md:text-2xl">
                    TURN {turnNumber} &nbsp;&nbsp; PLAYER {activePlayer === "P1" ? "1" : "2"}
                </div>
            </div>
        </div>
    )
}

export default function GamePage({ onBack, minionConfigs }) {
    // เก็บ State ทั้งก้อนที่โหลดจาก Backend
    const [gameState, setGameState] = useState(null)
    const [selectedHex, setSelectedHex] = useState(null)

    // โหลดข้อมูลตอนเข้าหน้าเกมครั้งแรก
    useEffect(() => {
        refreshBoard()
    }, [])

    const refreshBoard = async () => {
        try {
            const data = await getGameState()
            setGameState(data)
        } catch (error) {
            console.error("Failed to load game state", error)
        }
    }

    // แปลงข้อมูลแผนที่จาก Backend ให้ BoardSVG อ่านง่ายๆ
    const boardMap = useMemo(() => {
        const map = new Map()
        if (!gameState) return map

        // ใส่ข้อมูลพื้นที่ที่โดนซื้อ
        gameState.hexes.forEach(hex => {
            map.set(`${hex.row},${hex.col}`, { owner: hex.ownerId, hasMinion: false })
        })

        // ใส่ข้อมูล Minion ทับลงไป
        gameState.minions.forEach(minion => {
            const current = map.get(`${minion.row},${minion.col}`) || {}
            map.set(`${minion.row},${minion.col}`, { ...current, owner: minion.ownerId, hasMinion: true })
        })

        return map
    }, [gameState])

    // ตรวจสอบช่องเกิด (ตามกติกา KOMBAT ผู้เล่น 1 เกิดได้แค่ริมซ้ายสุด หรืออื่นๆ ตามสเปค)
    // สำหรับตอนนี้เรายอมให้วางที่ไหนก็ได้ที่เป็นพื้นที่ตัวเอง หรือยังไม่มีเจ้าของ
    const spawnZone = useMemo(() => {
        // คุณสามารถเขียน Logic จำกัดช่องเกิดได้ตรงนี้
        return new Set()
    }, [])

    const handleHexClick = (row, col) => {
        setSelectedHex({ row, col })
    }

    // ฟังก์ชันกดจบเทิร์น
    const handleEndTurn = async () => {
        await endTurn()
        setSelectedHex(null)
        await refreshBoard()
    }

    // ฟังก์ชันซื้อพื้นที่ (Buy Hex)
    const handleBuyHex = async () => {
        if (!selectedHex || !gameState) return
        const success = await buyHex(gameState.currentPlayerId, selectedHex.row, selectedHex.col)
        if (success) {
            await refreshBoard()
            alert("Area secured!")
        } else {
            alert("Cannot buy this hex. Check your budget or adjacency rules.")
        }
    }

    // ฟังก์ชันวาง Minion (Spawn)
    const handleSpawnMinion = async () => {
        if (!selectedHex || !gameState || minionConfigs.length === 0) return

        // ตอนนี้เราดึงตัวแรกจาก Array มาวางก่อน (สามารถทำ UI เลือกตัวละครเพิ่มทีหลังได้)
        const typeNameToSpawn = minionConfigs[0]?.name

        const success = await spawnMinion(gameState.currentPlayerId, selectedHex.row, selectedHex.col, typeNameToSpawn)
        if (success) {
            await refreshBoard()
            alert("Minion deployed!")
        } else {
            alert("Failed to spawn minion.")
        }
    }

    if (!gameState) return <div className="text-white text-center mt-20 text-2xl">Loading Battlefield...</div>

    const activePlayerId = gameState.currentPlayerId
    const p1 = gameState.players.find(p => p.id === 1)
    const p2 = gameState.players.find(p => p.id === 2)

    return (
        <div className="min-h-screen text-white relative overflow-hidden">
            {/* ... Background และ HeaderBar ... */}

            <div className="relative z-10 w-full px-6 md:px-10 pt-6 pb-24">
                <div className="relative min-h-[760px] flex items-center justify-center">
                    {/* LEFT PANEL */}
                    <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel player="P1" active={activePlayerId === 1} budget={p1?.budget || 0} hp={p1?.totalHp || 0} inventory={minionConfigs} />
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel player="P2" active={activePlayerId === 2} budget={p2?.budget || 0} hp={p2?.totalHp || 0} inventory={minionConfigs} />
                    </div>

                    {/* ✅ CENTER BOARD */}
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-[min(90vw,900px)] h-[min(80vh,800px)]">
                            <BoardSVG
                                rows={8} cols={8} size={42} padding={50}
                                selected={selectedHex}
                                spawnZone={spawnZone}
                                activePlayer={activePlayerId}
                                boardState={boardMap}
                                onHexClick={handleHexClick}
                                className="w-full h-full"
                            />
                        </div>

                        {/* แผงควบคุมตรงกลางเมื่อกดเลือก Hex */}
                        {selectedHex && (
                            <div className="mt-4 flex gap-4 bg-black/60 p-4 rounded-xl border border-white/20 backdrop-blur-md">
                                <span className="text-xl font-bold self-center mr-4">Hex ({selectedHex.row}, {selectedHex.col})</span>
                                <button onClick={handleBuyHex} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded font-bold transition">💰 Buy Area</button>
                                <button onClick={handleSpawnMinion} className="bg-sky-600 hover:bg-sky-500 px-6 py-2 rounded font-bold transition">⚔️ Spawn Minion</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* bottom controls */}
            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
                <button onClick={handleEndTurn} className="arcane-pill arcane-pill--gold px-10 py-4 font-bold text-lg hover:scale-105 transition">
                    END TURN {gameState.turnCount}
                </button>
            </div>
        </div>
    )
}