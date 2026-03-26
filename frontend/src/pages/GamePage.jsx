import { useEffect, useMemo, useState } from "react"
import BoardSVG from "../components/BoardSVG"
import { getGameState, endTurn, buyHex, spawnMinion } from "../api/gameApi"

function getSpawnZone(playerStr) {
    if (playerStr === "P1") return new Set(["1,1","1,2","1,3","2,1","2,2"])
    return new Set(["8,8","8,7","8,6","7,8","7,7"])
}

const P1_SPAWN = new Set(["1,1","1,2","1,3","2,1","2,2"])
const P2_SPAWN = new Set(["8,8","8,7","8,6","7,8","7,7"])

// ระบบหาช่องข้างเคียงแบบ Odd-Q Layout
function getNeighbors(row, col) {
    const isOdd = col % 2 !== 0;
    return [
        [row - 1, col],
        [row + 1, col],
        [isOdd ? row : row - 1, col - 1],
        [isOdd ? row : row - 1, col + 1],
        [isOdd ? row + 1 : row, col - 1],
        [isOdd ? row + 1 : row, col + 1],
    ].filter(([r, c]) => r >= 1 && r <= 8 && c >= 1 && c <= 8);
}

// หาพื้นที่ที่สามารถซื้อได้ (ต้องอยู่ติดอาณาเขตตัวเอง)
function computePurchasableHexes(boardMap, activePlayerId) {
    const purchasable = new Set()
    boardMap.forEach((data, key) => {
        if (data.owner !== activePlayerId) return

        const [r, c] = key.split(",").map(Number)
        for (const [nr, nc] of getNeighbors(r, c)) {
            const nKey = `${nr},${nc}`
            const neighborData = boardMap.get(nKey)

            if (!neighborData || neighborData.owner == null) {
                purchasable.add(nKey)
            }
        }
    })
    return purchasable
}

function HeaderBar({ turnNumber, activePlayer }) {
    const theme = activePlayer === "P1" ? "arcane-pill--cyan" : "arcane-pill--crimson"
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

function PlayerPanel({ player, active, budget, hp, inventory, onShop }) {
    const base = "relative rounded-2xl border bg-black/30 backdrop-blur p-4 md:p-5"
    const identity = player === "P1"
        ? "border-sky-300/40 shadow-[0_0_18px_rgba(59,130,246,0.25)]"
        : "border-rose-300/40 shadow-[0_0_18px_rgba(239,68,68,0.25)]"
    const activeGlow = player === "P1"
        ? "shadow-[0_0_18px_rgba(59,130,246,0.45)] ring-1 ring-sky-300/40"
        : "shadow-[0_0_18px_rgba(239,68,68,0.45)] ring-1 ring-rose-300/40"
    const lockedStyle = "opacity-60 grayscale"

    return (
        <div className={`${base} ${identity} ${active ? activeGlow : lockedStyle}`}>
            {!active && (
                <div className="absolute inset-0 rounded-2xl bg-black/10 cursor-not-allowed z-10" />
            )}
            <div className={`${!active ? "pointer-events-none select-none" : ""}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-white/70">PLAYER</div>
                        <div className="text-2xl font-semibold text-white">
                            {player === "P1" ? "PLAYER 1" : "PLAYER 2"}
                        </div>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-white/15 bg-white/10 flex items-center justify-center">
                        <img src="/player.png" alt="Player avatar" className="h-7 w-7 object-contain" draggable="false" />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className="text-sm text-white/60">BUDGET</div>
                        <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                            <img src="/coin.png" alt="Coin" className="h-6 w-6 object-contain" draggable="false" />
                            <span>{Math.floor(budget)}</span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className="text-sm text-white/60">ALIVE MINIONS</div>
                        <div className="mt-1 text-xl font-semibold text-sky-300">⚔️ {hp}</div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={onShop}
                        className={`px-5 py-2.5 text-base rounded-lg border border-white/15 ${
                            active ? "bg-amber-300/20 hover:bg-amber-300/30 text-amber-100" : "bg-white/5 text-white/40"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <img src="/shop.png" alt="Shop" className="h-6 w-6 object-contain" draggable="false" />
                            SHOP
                        </span>
                    </button>
                    <div className="text-sm text-white/60">{active ? "ACTIVE" : "LOCKED"}</div>
                </div>

                <div className="mt-4">
                    <div className="text-sm text-white/60 mb-2">INVENTORY</div>
                    {inventory.length === 0 ? (
                        <div className="text-sm text-white/50">No minions bought</div>
                    ) : (
                        <div className="grid grid-cols-5 gap-2">
                            {inventory.map((item, i) => (
                                <div
                                    key={`${player}-${item.id || item}-${i}`}
                                    className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1"
                                    title={item.name || item.label}
                                >
                                    <img
                                        src={item.imageUrl || item.iconUrl || "/minion-robot.png"}
                                        alt={item.name || "Minion"}
                                        className="h-full w-full object-contain"
                                        draggable="false"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function GamePage({ onBack, minionConfigs = [] }) {
    const [gameState, setGameState] = useState(null)
    const [selectedHex, setSelectedHex] = useState(null)
    const [selectedMinionType, setSelectedMinionType] = useState(minionConfigs[0]?.name || "")
    const [isBotActive, setIsBotActive] = useState(true)

    useEffect(() => {
        if (minionConfigs.length > 0 && !selectedMinionType) {
            setSelectedMinionType(minionConfigs[0]?.name || "")
        }
    }, [minionConfigs, selectedMinionType])

    useEffect(() => { refreshBoard() }, [])

    const refreshBoard = async () => {
        try {
            const data = await getGameState()
            setGameState(data)
        } catch (error) {
            console.error("Failed to load game state", error)
        }
    }

    const handleEndTurn = async () => {
        await endTurn()
        setSelectedHex(null)
        await refreshBoard()
    }

    const boardMap = useMemo(() => {
        const map = new Map()
        if (!gameState?.board) return map

        for (let r = 1; r <= 8; r++) {
            for (let c = 1; c <= 8; c++) {
                const key = `${r},${c}`
                const hexData = gameState.board?.[r]?.[c]

                let hexOwnerId = hexData?.ownerId ?? null
                if (hexOwnerId == null) {
                    if (P1_SPAWN.has(key)) hexOwnerId = 1
                    else if (P2_SPAWN.has(key)) hexOwnerId = 2
                }

                const hasMinion = !!hexData?.occupant
                const occupantOwnerId = hasMinion ? hexData.occupant.ownerId : null

                map.set(key, {
                    owner: hexOwnerId != null ? Number(hexOwnerId) : null,
                    occupantOwner: occupantOwnerId != null ? Number(occupantOwnerId) : null,
                    hasMinion,
                    hp:    hasMinion ? hexData.occupant.hp    : null,
                    maxHp: hasMinion ? hexData.occupant.maxHp : null,
                    name:  hasMinion ? hexData.occupant.name  : null,
                })
            }
        }
        return map
    }, [gameState])

    const activePlayerId  = gameState?.currentPlayerId ?? gameState?.activePlayerId ?? 1
    const activePlayerStr = activePlayerId === 1 ? "P1" : "P2"
    const spawnZone       = useMemo(() => getSpawnZone(activePlayerStr), [activePlayerStr])

    const purchasableHexes = useMemo(() => {
        if (!gameState || gameState.turnCount < 2) return new Set()
        return computePurchasableHexes(boardMap, activePlayerId)
    }, [boardMap, activePlayerId, gameState?.turnCount])

    const p1 = gameState?.players?.["1"]
    const p2 = gameState?.players?.["2"]

    // 🌟 ระบบ AI Bot (หยุดเล่นเมื่อเกมจบ)
    useEffect(() => {
        let timer;
        const p1Alive = p1?.aliveMinionCount ?? 1;
        const p2Alive = p2?.aliveMinionCount ?? 1;

        // ดักว่าเกมจบหรือยัง (มีใครตายหมดหลังจากเทิร์น 2, หรือชนะด้วยเทิร์นหมด)
        const isGameOver = gameState?.winner ||
            gameState?.turnCount >= 200 ||
            (gameState?.turnCount > 2 && (p1Alive === 0 || p2Alive === 0));

        if (isBotActive && gameState && !isGameOver) {
            timer = setTimeout(async () => {
                try {
                    // 1. ซื้อพื้นที่
                    const purchasables = Array.from(purchasableHexes);
                    if (purchasables.length > 0) {
                        const randomHex = purchasables[Math.floor(Math.random() * purchasables.length)];
                        const [r, c] = randomHex.split(',').map(Number);
                        await buyHex(activePlayerId, r, c).catch(() => {});
                    }

                    // 2. วางมินเนี่ยน
                    const emptySpawns = Array.from(spawnZone).filter(key => {
                        const cell = boardMap.get(key);
                        return cell && !cell.hasMinion;
                    });
                    if (emptySpawns.length > 0 && minionConfigs.length > 0) {
                        const randomSpawn = emptySpawns[Math.floor(Math.random() * emptySpawns.length)];
                        const [r, c] = randomSpawn.split(',').map(Number);
                        const typeToSpawn = selectedMinionType || minionConfigs[0]?.name || "";
                        await spawnMinion(activePlayerId, r, c, typeToSpawn).catch(() => {});
                    }

                    // 3. จบเทิร์น
                    await handleEndTurn();

                } catch (error) {
                    console.error("Bot AI error:", error);
                }
            }, 800);
        }
        return () => clearTimeout(timer);
    }, [isBotActive, gameState, purchasableHexes, spawnZone, activePlayerId, minionConfigs, selectedMinionType, p1, p2]);

    const onHexClick = (row, col) => setSelectedHex({ row, col })

    const handleSpawnMinion = async () => {
        if (!selectedHex || !gameState || !selectedMinionType) return
        const success = await spawnMinion(activePlayerId, selectedHex.row, selectedHex.col, selectedMinionType)
        if (success) { await refreshBoard(); setSelectedHex(null) }
        else alert("Cannot spawn here! Check your budget or location.")
    }

    const handleBuyHex = async () => {
        if (!selectedHex) return
        const success = await buyHex(activePlayerId, selectedHex.row, selectedHex.col)
        if (success) { await refreshBoard(); setSelectedHex(null) }
        else alert("Cannot buy this hex!")
    }

    if (!gameState) {
        return <div className="min-h-screen flex items-center justify-center text-white text-2xl font-bold bg-gray-900">Loading Battlefield...</div>
    }

    // คำนวณสถานะจบเกมเพื่อแสดงข้อความ
    const p1Alive = p1?.aliveMinionCount ?? 1;
    const p2Alive = p2?.aliveMinionCount ?? 1;
    const isGameOver = gameState?.winner || gameState?.turnCount >= 200 || (gameState?.turnCount > 2 && (p1Alive === 0 || p2Alive === 0));

    return (
        <div className="min-h-screen text-white relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <img src="/battle-bg.png" alt="Battle Background" className="w-full h-full object-cover" draggable="false" />
            </div>
            <div className="absolute inset-0 bg-black/20 -z-10" />

            <div className="relative z-10">
                <HeaderBar turnNumber={gameState.turnCount} activePlayer={activePlayerStr} />
            </div>

            <div className="relative z-10 w-full px-6 md:px-10 pt-6 pb-24">
                {selectedHex && (() => {
                    const key = `${selectedHex.row},${selectedHex.col}`
                    const cellData = boardMap.get(key)
                    const hasMinion = cellData?.hasMinion
                    const isPurchasable = purchasableHexes.has(key)
                    const inSpawnZone = spawnZone.has(key)
                    const canSpawn = inSpawnZone && !hasMinion && !isGameOver // ห้าม Spawn ถ้าเกมจบ

                    return (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 px-6 py-4 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl z-50 flex-wrap justify-center">
                            <span className="text-xl font-bold text-amber-400">
                                HEX ({selectedHex.row},{selectedHex.col})
                            </span>

                            {hasMinion && (
                                <div className="flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10">
                                    <span className="font-semibold">{cellData.name || "Minion"}</span>
                                    <span className="font-bold text-green-400">❤️ {cellData.hp} / {cellData.maxHp}</span>
                                </div>
                            )}

                            {!hasMinion && canSpawn && (
                                <>
                                    <select
                                        value={selectedMinionType}
                                        onChange={(e) => setSelectedMinionType(e.target.value)}
                                        className="rounded-lg bg-black/70 border border-white/30 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    >
                                        {minionConfigs.length > 0
                                            ? minionConfigs.map((m, i) => (
                                                <option key={m.name || i} value={m.name || m.label || ""}>
                                                    {m.name || m.label || `Minion ${i + 1}`}
                                                </option>
                                            ))
                                            : <option value="">— No types defined —</option>
                                        }
                                    </select>
                                    <button
                                        onClick={handleSpawnMinion}
                                        disabled={!selectedMinionType}
                                        className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-5 py-2 rounded-lg font-bold transition"
                                    >
                                        ⚔️ SPAWN
                                    </button>
                                </>
                            )}

                            {isPurchasable && !isGameOver && (
                                <button
                                    onClick={handleBuyHex}
                                    className="bg-amber-500 hover:bg-amber-400 px-5 py-2 rounded-lg font-bold transition"
                                >
                                    💰 BUY HEX
                                </button>
                            )}

                            <button
                                onClick={() => setSelectedHex(null)}
                                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-bold transition"
                            >
                                CLOSE
                            </button>
                        </div>
                    )
                })()}

                <div className="relative min-h-[760px] flex items-center justify-center mt-6">
                    <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-[340px] z-20 pointer-events-none">
                        <PlayerPanel player="P1" active={activePlayerId === 1 && !isGameOver} budget={p1?.budget || 0} hp={p1?.aliveMinionCount || 0} inventory={minionConfigs} onShop={() => {}} />
                    </div>
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-[340px] z-20 pointer-events-none">
                        <PlayerPanel player="P2" active={activePlayerId === 2 && !isGameOver} budget={p2?.budget || 0} hp={p2?.aliveMinionCount || 0} inventory={minionConfigs} onShop={() => {}} />
                    </div>

                    <div className="flex items-center justify-center w-full">
                        <div className="w-[min(98vw,1500px)] h-[min(82vh,1500px)]">
                            <BoardSVG
                                rows={8} cols={8} size={55} padding={40}
                                selected={selectedHex}
                                spawnZone={spawnZone}
                                activePlayer={activePlayerId}
                                boardState={boardMap}
                                purchasableHexes={purchasableHexes}
                                onHexClick={onHexClick}
                                className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-4">
                <button
                    onClick={handleEndTurn}
                    disabled={isBotActive || isGameOver}
                    className="arcane-pill arcane-pill--gold arcane-button px-8 py-4 text-sm md:text-base font-semibold shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                >
                    {isGameOver ? "GAME OVER" : `TURN ${gameState?.turnCount || 0}`}
                </button>

                <button
                    onClick={() => setIsBotActive(!isBotActive)}
                    disabled={isGameOver}
                    className={`px-6 py-4 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 ${
                        isGameOver ? "bg-gray-600 text-white opacity-50 cursor-not-allowed" :
                            isBotActive
                                ? "bg-red-500 hover:bg-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                                : "bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.6)]"
                    }`}
                >
                    {isGameOver ? "🛑 GAME ENDED" : (isBotActive ? "⏸ PAUSE BOT" : "🤖 START BOT")}
                </button>
            </div>

            {onBack && (
                <div className="fixed bottom-6 left-6 z-20">
                    <button onClick={onBack} className="px-4 py-2 rounded-lg bg-black/35 border border-white/10 hover:bg-black/45 transition">
                        <img src="/back.png" alt="Back" className="h-10 w-auto md:h-12" draggable="false" />
                    </button>
                </div>
            )}
        </div>
    )
}