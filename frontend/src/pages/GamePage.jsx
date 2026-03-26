import { useEffect, useMemo, useState } from "react"
import BoardSVG from "../components/BoardSVG"
import { getGameState, endTurn, buyHex, spawnMinion , buyMinionFromShop } from "../api/gameApi"

function getSpawnZone(playerStr) {
    if (playerStr === "P1") return new Set(["1,1","1,2","1,3","2,1","2,2"])
    return new Set(["8,8","8,7","8,6","7,8","7,7"])
}

// spawn zone hardcode ตรงกับ backend initializeBoard()
const P1_SPAWN = new Set(["1,1","1,2","1,3","2,1","2,2"])
const P2_SPAWN = new Set(["8,8","8,7","8,6","7,8","7,7"])

// ตรงกับ backend getNeighbor() — odd row (1,3,5,7) shift left
function getNeighbors(row, col) {
    const isOdd = row % 2 !== 0
    return [
        [row - 1, col],
        [row + 1, col],
        [row - 1, isOdd ? col - 1 : col    ],
        [row - 1, isOdd ? col     : col + 1],
        [row + 1, isOdd ? col - 1 : col    ],
        [row + 1, isOdd ? col     : col + 1],
    ].filter(([r, c]) => r >= 1 && r <= 8 && c >= 1 && c <= 8)
}

// คำนวณ hex ที่ซื้อได้ = ไม่มีเจ้าของ + ติดกับ hex ของเรา
function computePurchasableHexes(boardMap, activePlayerId) {
    const purchasable = new Set()

    boardMap.forEach((data, key) => {
        if (data.owner !== activePlayerId) return

        const [r, c] = key.split(",").map(Number)
        for (const [nr, nc] of getNeighbors(r, c)) {
            const nKey = `${nr},${nc}`
            if (!boardMap.has(nKey)) {
                purchasable.add(nKey)
            }
        }
    })

    return purchasable
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


// === หน้าหลัก GamePage ===
export default function GamePage({ onBack, minionConfigs = [] }) {
    const [gameState, setGameState] = useState(null)
    const [selectedHex, setSelectedHex] = useState(null)

    useEffect(() => { refreshBoard() }, [])

    const refreshBoard = async () => {
        try {
            const data = await getGameState()
            setGameState(data)
        } catch (error) {
            console.error("Failed to load game state", error)
        }
    }

    const boardMap = useMemo(() => {
        const map = new Map()
        if (!gameState?.board) return map

        for (let r = 1; r <= 8; r++) {
            for (let c = 1; c <= 8; c++) {
                const key = `${r},${c}`
                const hexData = gameState.board?.[r]?.[c]

                // อ่าน ownerId จาก backend ก่อน
                let ownerId = hexData?.ownerId
                    ?? hexData?.occupant?.ownerId
                    ?? null

                // ── KEY FIX ──
                // Hex.java มี @JsonIgnore บน owner field และ getOwnerId() อาจไม่ serialize
                // จึง fallback จาก spawn zone ที่ตรงกับ backend initializeBoard()
                // รวมถึง hex ที่ถูก buyHex() ไปแล้ว backend ก็ควรส่ง ownerId มาด้วย
                if (ownerId == null) {
                    if (P1_SPAWN.has(key)) ownerId = 1
                    else if (P2_SPAWN.has(key)) ownerId = 2
                }

                if (ownerId != null) {
                    const hasMinion = !!hexData?.occupant
                    map.set(key, {
                        owner: Number(ownerId),
                        hasMinion,
                        hp:    hasMinion ? hexData.occupant.hp    : null,
                        maxHp: hasMinion ? hexData.occupant.maxHp : null,
                        name:  hasMinion ? hexData.occupant.name  : null,
                    })
                }
            }
        }
        return map
    }, [gameState])



    const activePlayerId  = gameState?.currentPlayerId ?? gameState?.activePlayerId ?? 1
    const activePlayerStr = activePlayerId === 1 ? "P1" : "P2"
    const spawnZone       = useMemo(() => getSpawnZone(activePlayerStr), [activePlayerStr])

    // ── คำนวณ purchasable hexes (เริ่ม turn 2 เป็นต้นไป) ──
    const purchasableHexes = useMemo(() => {
        if (!gameState || gameState.turnCount < 2) return new Set()
        return computePurchasableHexes(boardMap, activePlayerId)
    }, [boardMap, activePlayerId, gameState?.turnCount])

    const onHexClick = (row, col) => setSelectedHex({ row, col })

    const handleEndTurn = async () => {
        await endTurn()
        setSelectedHex(null)
        await refreshBoard()
    }

    const handleSpawnMinion = async () => {
        if (!selectedHex || !gameState || minionConfigs.length === 0) return
        const success = await spawnMinion(activePlayerId, selectedHex.row, selectedHex.col, minionConfigs[0]?.name)
        if (success) { await refreshBoard(); setSelectedHex(null) }
        else alert("Cannot spawn here! Check your budget or location.")
    }

    const handleBuyHex = async () => {
        if (!selectedHex) return
        const success = await buyHex(activePlayerId, selectedHex.row, selectedHex.col)
        if (success) { await refreshBoard(); setSelectedHex(null) }
        else alert("Cannot buy this hex!")
    }

    // กดปุ่ม Shop
    const [minionTypes, setMinionTypes] = useState([]); // เก็บ type ของ Minion
    const [isShopOpen, setIsShopOpen] = useState(false)
    const [expandedStates, setExpandedStates] = useState({});
    const handleShop = () => {
        setIsShopOpen(true)
    }
    useEffect(() => {
        console.log("Shop status:", isShopOpen);
        console.log("Minion Configs from Setup:", minionConfigs);
        if (isShopOpen) {
            console.log("Shop is Open! Checking configs...", minionConfigs);
            // ถ้ามี minionConfigs ส่งมาจาก Setup ให้เอาไปใส่ใน Shop
            if (minionConfigs && minionConfigs.length > 0) {
                setMinionTypes(minionConfigs);
            }
            // ถ้าใน gameState มีประเภทใหม่ๆ ก็ให้เอามาใส่ด้วย
            else if (gameState?.minionTypes) {
                setMinionTypes(gameState.minionTypes);
            }
        }
    }, [isShopOpen, gameState,gameState]);

    //Api
    const handleBuyUnit = async (minion) => {
        try {
            // ยิง API ไปหักเงินและเพิ่มของเข้ากระเป๋า
            await buyMinionFromShop(activePlayerId, minion.name);

            // ถ้าสำเร็จ ให้โหลดข้อมูลกระดานและเงินใหม่
            await refreshBoard();
            alert(`Successfully purchased ${minion.name}!`);

        } catch (error) {
            // ระบบจะดึงข้อความ Error จาก client.js มาแสดง (เช่น "Not enough budget")
            alert(error.message || "Failed to buy minion");
        }
    }

    if (!gameState) {
        return <div className="min-h-screen flex items-center justify-center text-white text-2xl font-bold bg-gray-900">Loading Battlefield...</div>
    }


    const p1 = gameState.players?.["1"]
    const p2 = gameState.players?.["2"]

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

                {/* Popup เมื่อคลิก hex */}
                {selectedHex && (() => {
                    const key = `${selectedHex.row},${selectedHex.col}`
                    const cellData = boardMap.get(key)
                    const hasMinion = cellData?.hasMinion
                    const isPurchasable = purchasableHexes.has(key)

                    return (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 px-6 py-4 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl z-50">
                            <span className="text-xl font-bold text-amber-400">HEX ({selectedHex.row},{selectedHex.col})</span>

                            {hasMinion ? (
                                <div className="flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10">
                                    <span className="font-semibold">{cellData.name || "Minion"}</span>
                                    <span className="font-bold text-green-400">❤️ {cellData.hp} / {cellData.maxHp}</span>
                                </div>
                            ) : (
                                <>
                                    <button onClick={handleSpawnMinion} className="bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-lg font-bold transition">
                                        ⚔️ SPAWN
                                    </button>
                                    {isPurchasable && (
                                        <button onClick={handleBuyHex} className="bg-amber-500 hover:bg-amber-400 px-5 py-2 rounded-lg font-bold transition">
                                            💰 BUY HEX
                                        </button>
                                    )}
                                </>
                            )}

                            <button onClick={() => setSelectedHex(null)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-bold transition">
                                CANCEL
                            </button>
                        </div>
                    )
                })()}

                <div className="relative min-h-[760px] flex items-center justify-center mt-6">
                    <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel player="P1"
                                     active={activePlayerId === 1}
                                     budget={p1?.budget || 0}
                                     hp={p1?.aliveMinionCount || 0}
                                     inventory={minionConfigs}
                                     onShop={handleShop} />
                    </div>
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel player="P2"
                                     active={activePlayerId === 2}
                                     budget={p2?.budget || 0}
                                     hp={p2?.aliveMinionCount || 0}
                                     inventory={minionConfigs}
                                     onShop={handleShop} />
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

            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
                <button onClick={handleEndTurn} className="arcane-pill arcane-pill--gold arcane-button px-10 py-4 text-sm md:text-base font-semibold shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105">
                    END TURN {gameState.turnCount}
                </button>
            </div>

            {onBack && (
                <div className="fixed bottom-6 left-6 z-20">
                    <button onClick={onBack} className="px-4 py-2 rounded-lg bg-black/35 border border-white/10 hover:bg-black/45 transition">
                        <img src="/back.png" alt="Back" className="h-10 w-auto md:h-12" draggable="false" />
                    </button>
                </div>
            )}

            {/* shop */}
            {isShopOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    {/* กรอบสีน้ำเงิน */}
                    <div className="bg-[#0b1024]
                            rounded-[40px] p-10
                            w-[85%]
                            h-[85%]
                            border border-[rgba(245,204,119,0.5)]
                            shadow-[0_0_50px_rgba(245,204,119,0.2)]
                            overflow-y-auto
                            relative
                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                        <div className="flex justify-between items-start mb-10">
                            {/* ปุ่มกลับ ซ้ายบน*/}
                            <button
                                onClick={() => setIsShopOpen(false)}
                                className="rounded-md border border-white/30 bg-black/40
                                px-4 py-2 text-sm font-semibold tracking-wide
                                text-white transition hover:border-white/60 hover:bg-black/60"
                            >
                                <img
                                    src="/back.png"
                                    alt="Back"
                                    className="h-10 w-auto md:h-12"
                                    draggable="false"
                                />
                            </button>
                            {/* แสดง budget ขวาบน*/}
                            <div className="flex justify-between items-center mb-10">
                                <div className="arcane-pill arcane-pill--gold px-8 py-3">
                                    <span className="text-2xl font-bold text-amber-300">
                    💰                   {activePlayerId === 1 ? Math.floor(p1?.budget || 0) : Math.floor(p2?.budget || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ส่วนแสดง minion */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 items-start">
                            {/* เช็คว่ามีข้อมูล minion ไหม */}
                            {minionTypes.length > 0 ? (
                                minionTypes.map((minion, index) => (
                                    <div key={index} className="group">
                                        <div className="bg-[#141a3a] rounded-[30px] p-6 flex flex-col items-center border border-white/5 ">
                                            {/* รูป */}
                                            <div className="relative w-45 h-52 shrink-0 aspect-[4/5]
                                            rounded-[24px] bg-[#f3f4f7]  flex items-center justify-center overflow-hidden">

                                                <div className="absolute inset-0 bg-gradient-to-b justify-center
                                                from-amber-200/10 to-transparent rounded-2xl -z-10" />
                                                <img
                                                    src={minion.imageUrl || "/minion-robot.png"}
                                                    alt={minion.name}
                                                    className="w-[85%] h-[85%] object-contain
                                                    rounded-[40px] relative z-10
                                                    drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]
                                                    "
                                                />

                                            </div>
                                            {/* ชื่อ */}
                                            <h3 className="arcane-header-text text-3xl  font-cinzel my-5">
                                                {minion.name || "Minion"}
                                            </h3>
                                            {/* Status */}
                                            <div className="flex gap-4 mt-2 text-md text-white/60">
                                                <span>HP: <span className="text-red-400 font-bold">100{minion.hp}</span></span>
                                                <span>DEF: <span className="text-blue-400 font-bold">{minion.defense}</span></span>
                                            </div>
                                            {/* strategy */}
                                            <button
                                                onClick={() => setExpandedStates(prev => ({ ...prev, [index]: !prev[index] }))}
                                                className="w-full flex justify-center items-center mb-2
                                                transition-colors"
                                            >
                                                <span className="text-amber-200 font-bold uppercase text-xm tracking-widest">
                                                    Minion Strategy
                                                </span>
                                                <span className="text-amber-200 text-lg">
                                                    {expandedStates[index] ? '−' : '+'}
                                                </span>
                                            </button>

                                            {/* แสดง Strategy */}
                                            <div className={`transition-all duration-300 ease-in-out bg-black/40 rounded-[15px] mb-4 
                                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                                            ${expandedStates[index]
                                                    ? 'h-60 w-full p-3 opacity-100 overflow-y-auto'
                                                    : 'h-0 w-full opacity-0 overflow-hidden'
                                            }`}>
                                                <p className="text-[11px] text-amber-100/70 font-mono leading-relaxed
                                                whitespace-pre-wrap break-words
                                                ">
                                                    {/* ดึงข้อมูล strategy จาก Setup มาแสดง */}
                                                    {minion.strategy || minion.script || "// No strategy defined"}
                                                </p>
                                            </div>

                                            {/* price & buy */}
                                            <button
                                                onClick={() => handleBuyUnit(minion)}
                                                className="flex items-center gap-2 my-2 bg-amber-50 px-4 py-1
                                                rounded-full border border-amber-100 mt-auto">
                                                {/*<img src="/coin.png" alt="coin" className="w-7 h-7" />*/}
                                                <span className="text-amber-700 font-bold text-lg tabular-nums">
                                                    ${minion.cost || 200}
                                                </span>
                                            </button>

                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* ไม่มีให้แสดง */
                                <div className="col-span-full text-center py-20">
                                    <p className="text-white/40 italic">No minions found. Please define them in Setup.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}