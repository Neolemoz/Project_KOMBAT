import { useEffect, useMemo, useState } from "react"
import BoardSVG from "../components/BoardSVG"
import { getGameState, endTurn, buyHex, spawnMinion } from "../api/gameApi"

// === ฟังก์ชันสำหรับโซนเกิด (อิงตาม P1/P2) ===
function getSpawnZone(playerStr) {
    if (playerStr === "P1") {
        return new Set(["1,1", "1,2", "1,3", "2,1", "2,2"])
    }
    return new Set(["8,8", "8,7", "8,6", "7,8", "7,7"])
}

function isInSpawnZone(playerStr, row, col) {
    return getSpawnZone(playerStr).has(`${row},${col}`)
}

// === Component ย่อย ===
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
                    <div className="h-10 w-10 rounded-full border border-white/15 bg-white/10 flex items-center justify-center" title="Avatar">
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

// === หน้าหลัก GamePage ===
export default function GamePage({ onBack, minionConfigs = [] }) {
    const [gameState, setGameState] = useState(null)
    const [selectedHex, setSelectedHex] = useState(null)

    // 1. ดึงข้อมูลครั้งแรกเมื่อโหลดหน้าจอ
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

    // 2. แปลงข้อมูล JSON จาก Backend เป็น Map ให้กระดานระบายสีถูก
    // แปลงข้อมูล 2D Array จาก Backend ให้กระดานเข้าใจ
    const boardMap = useMemo(() => {
        const map = new Map()
        if (!gameState || !gameState.board) return map

        for (let r = 1; r <= 8; r++) {
            if (!gameState.board[r]) continue
            for (let c = 1; c <= 8; c++) {
                const hexData = gameState.board[r][c]
                if (hexData) {
                    let hexOwnerId = null;
                    if (hexData.ownerId) hexOwnerId = hexData.ownerId;
                    else if (hexData.occupant && hexData.occupant.ownerId) hexOwnerId = hexData.occupant.ownerId;

                    const hasMinion = !!hexData.occupant

                    if (hexOwnerId) {
                        map.set(`${r},${c}`, {
                            owner: Number(hexOwnerId),
                            hasMinion: hasMinion,
                            // 🌟 ดึงข้อมูล HP รายตัวของมินเนี่ยนมาด้วย
                            hp: hasMinion ? hexData.occupant.hp : null,
                            maxHp: hasMinion ? hexData.occupant.maxHp : null,
                            name: hasMinion ? hexData.occupant.name : null
                        })
                    }
                }
            }
        }
        return map
    }, [gameState])

    // เตรียมตัวแปรช่วยเช็คสถานะปัจจุบัน
    const activePlayerId = gameState?.activePlayerId || 1
    const activePlayerStr = activePlayerId === 1 ? "P1" : "P2"

    // โซนเกิดที่แสงไฮไลต์จะแสดง (อิงตามตาผู้เล่น)
    const spawnZone = useMemo(() => getSpawnZone(activePlayerStr), [activePlayerStr])

    const onHexClick = (row, col) => {
        // ให้ผู้เล่นคลิกได้ทุกช่องเลยก็ได้ หรือจะบังคับแค่โซนเกิดก็ได้ (ตอนนี้อนุญาตให้คลิกได้อิสระเพื่อดูข้อมูลช่อง)
        setSelectedHex({ row, col })
    }

    const handleEndTurn = async () => {
        await endTurn()
        setSelectedHex(null)
        await refreshBoard()
    }

    const handleSpawnMinion = async () => {
        if (!selectedHex || !gameState || minionConfigs.length === 0) return

        // ส่งตัวแรกในทีมไปวาง
        const typeNameToSpawn = minionConfigs[0]?.name
        const success = await spawnMinion(activePlayerId, selectedHex.row, selectedHex.col, typeNameToSpawn)

        if (success) {
            await refreshBoard()
            setSelectedHex(null)
        } else {
            alert("Cannot spawn here! Check your budget or location.")
        }
    }

    // ฟังก์ชันปุ่ม Shop
    const handleShop = () => {
        alert("Shop feature is under construction! (Buy hex / Upgrade minion)")
    }

    // หน้า Loading ระหว่างรอข้อมูลจาก Backend
    if (!gameState) {
        return <div className="min-h-screen flex items-center justify-center text-white text-2xl font-bold bg-gray-900">Loading Battlefield...</div>
    }

    const p1 = gameState.players["1"]
    const p2 = gameState.players["2"]

    return (
        <div className="min-h-screen text-white relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <img src="/battle-bg.png" alt="Battle Background" className="w-full h-full object-cover" draggable="false" />
            </div>
            <div className="absolute inset-0 bg-black/20 -z-10" />

            {/* top bar */}
            <div className="relative z-10">
                <HeaderBar turnNumber={gameState.turnCount} activePlayer={activePlayerStr} />
            </div>

            {/* ✅ MAIN STAGE */}
            <div className="relative z-10 w-full px-6 md:px-10 pt-6 pb-24">

                {/* 🌟 Popup Menu สำหรับกด Spawn หรือ ซื้อพื้นที่ 🌟 */}
                {selectedHex && (() => {
                    const cellData = boardMap.get(`${selectedHex.row},${selectedHex.col}`)
                    const hasMinion = cellData?.hasMinion

                    return (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 px-6 py-4 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl z-50 animate-fade-in-up">
                            <span className="text-xl font-bold text-amber-400 mr-2">HEX ({selectedHex.row}, {selectedHex.col})</span>

                            {/* ถ้าช่องนั้นมีมินเนี่ยน ให้แสดงแถบ HP แทนปุ่ม Spawn */}
                            {hasMinion ? (
                                <div className="flex items-center gap-3 mr-2 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10">
                                    <span className="font-semibold text-white">{cellData.name || "Minion"}</span>
                                    <span className="font-bold text-green-400">❤️ {cellData.hp} / {cellData.maxHp}</span>
                                </div>
                            ) : (
                                <button onClick={handleSpawnMinion} className="bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-lg font-bold transition shadow-[0_0_10px_rgba(2,132,199,0.5)]">
                                    ⚔️ SPAWN
                                </button>
                            )}

                            <button onClick={() => setSelectedHex(null)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-bold transition">
                                CANCEL
                            </button>
                        </div>
                    )
                })()}

                <div className="relative min-h-[760px] flex items-center justify-center mt-6">
                    {/* LEFT PANEL */}
                    <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel
                            player="P1"
                            active={activePlayerId === 1}
                            budget={p1?.budget || 0}
                            hp={p1?.aliveMinionCount || 0}
                            inventory={minionConfigs}
                            onShop={handleShop}
                        />
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel
                            player="P2"
                            active={activePlayerId === 2}
                            budget={p2?.budget || 0}
                            hp={p2?.aliveMinionCount || 0}
                            inventory={minionConfigs}
                            onShop={handleShop}
                        />
                    </div>

                    {/* ✅ CENTER BOARD */}
                    <div className="flex items-center justify-center w-full">
                        <div className="w-[min(98vw,1500px)] h-[min(82vh,1500px)]">
                            <BoardSVG
                                rows={8}
                                cols={8}
                                size={55}      // ปรับขนาดความสวยงาม (เดิม 60 อาจจะชนขอบ)
                                padding={40}
                                selected={selectedHex}
                                spawnZone={spawnZone}
                                activePlayer={activePlayerId} // ส่ง 1 หรือ 2 ให้บอร์ดใช้ไฮไลต์สีเกิด
                                boardState={boardMap} // ส่งข้อมูลพื้นที่จริงๆ ให้ระบายสี
                                onHexClick={onHexClick}
                                className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom controls */}
            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
                <button
                    onClick={handleEndTurn}
                    className="arcane-pill arcane-pill--gold arcane-button px-10 py-4 text-sm md:text-base font-semibold shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105"
                >
                    END TURN {gameState.turnCount}
                </button>
            </div>

            {/* back */}
            {onBack && (
                <div className="fixed bottom-6 left-6 z-20">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-black/35 border border-white/10 hover:bg-black/45 transition"
                    >
                        <img src="/back.png" alt="Back" className="h-10 w-auto md:h-12" draggable="false" />
                    </button>
                </div>
            )}
        </div>
    )
}