import { useMemo, useState } from "react"
import BoardSVG from "../components/BoardSVG"

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

function PlayerPanel({ player, active, budget, hp, inventory, onShop }) {
    const base =
        "relative rounded-2xl border bg-black/30 backdrop-blur p-4 md:p-5"

    const identity =
        player === "P1"
            ? "border-sky-300/40 shadow-[0_0_18px_rgba(59,130,246,0.25)]"
            : "border-rose-300/40 shadow-[0_0_18px_rgba(239,68,68,0.25)]"

    const activeGlow =
        player === "P1"
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

                    <div
                        className="h-10 w-10 rounded-full border border-white/15 bg-white/10 flex items-center justify-center"
                        title="Avatar"
                    >
                        <img
                            src="/player.png"
                            alt="Player avatar"
                            className="h-7 w-7 object-contain"
                            draggable="false"
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className="text-sm text-white/60">BUDGET</div>
                        <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                            <img
                                src="/coin.png"
                                alt="Coin"
                                className="h-6 w-6 object-contain"
                                draggable="false"
                            />
                            <span>{budget}</span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className="text-sm text-white/60">HP</div>
                        <div className="text-2xl font-semibold">{hp}</div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={onShop}
                        className={`px-5 py-2.5 text-base rounded-lg border border-white/15 ${
                            active
                                ? "bg-amber-300/20 hover:bg-amber-300/30 text-amber-100"
                                : "bg-white/5 text-white/40"
                        }`}
                    >
            <span className="flex items-center gap-2">
              <img
                  src="/shop.png"
                  alt="Shop"
                  className="h-6 w-6 object-contain"
                  draggable="false"
              />
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
                                    className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
                                    title={item.label || item.id || item}
                                >
                                    {item.iconUrl ? (
                                        <img
                                            src={item.iconUrl}
                                            alt={item.label || "Minion"}
                                            className="h-7 w-7 object-contain"
                                            draggable="false"
                                        />
                                    ) : (
                                        <span className="text-xs text-white/60">
                      {(item.label || item.id || item || "?").slice(0, 2)}
                    </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function GamePage({ onBack, minionConfigs: _minionConfigs }) {
    const [game, setGame] = useState(() => ({
        turnNumber: 1,
        activePlayer: "P1",
        budgets: { P1: 30, P2: 30 },
        hp: { P1: 100, P2: 100 },
        inventory: { P1: [], P2: [] },
        board: buildEmptyBoard(8, 8),
        selected: null, // {row,col}
    }))

    const spawnZone = useMemo(
        () => getSpawnZone(game.activePlayer),
        [game.activePlayer]
    )

    const onHexClick = (row, col) => {
        if (!isInSpawnZone(game.activePlayer, row, col)) return
        setGame((g) => ({ ...g, selected: { row, col } }))
    }

    const addInventoryItem = () => {
        setGame((g) => {
            const nextInventory = { ...g.inventory }
            const owner = g.activePlayer
            const list = nextInventory[owner] || []
            const nextItem = {
                id: `minion-${list.length + 1}`,
                label: `Minion ${list.length + 1}`,
            }
            nextInventory[owner] = [...list, nextItem]
            return { ...g, inventory: nextInventory }
        })
    }

    const endTurn = () => {
        setGame((g) => {
            const nextPlayer = g.activePlayer === "P1" ? "P2" : "P1"
            const nextTurn = g.activePlayer === "P2" ? g.turnNumber + 1 : g.turnNumber
            return {
                ...g,
                activePlayer: nextPlayer,
                turnNumber: nextTurn,
                selected: null,
            }
        })
    }

    return (
        <div className="min-h-screen text-white relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <img
                    src="/battle-bg.png"
                    alt="Battle Background"
                    className="w-full h-full object-cover"
                    draggable="false"
                />
            </div>
            <div className="absolute inset-0 bg-black/20 -z-10" />

            {/* top bar */}
            <div className="relative z-10">
                <HeaderBar turnNumber={game.turnNumber} activePlayer={game.activePlayer} />
            </div>

            {/* ✅ MAIN STAGE: ใช้ relative + absolute panels + center board */}
            <div className="relative z-10 w-full px-6 md:px-10 pt-6 pb-24">
                <div className="relative min-h-[760px] flex items-center justify-center">
                    {/* LEFT PANEL */}
                    <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel
                            player="P1"
                            active={game.activePlayer === "P1"}
                            budget={game.budgets.P1}
                            hp={game.hp.P1}
                            inventory={game.inventory.P1}
                            onShop={addInventoryItem}
                        />
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-[340px] z-20">
                        <PlayerPanel
                            player="P2"
                            active={game.activePlayer === "P2"}
                            budget={game.budgets.P2}
                            hp={game.hp.P2}
                            inventory={game.inventory.P2}
                            onShop={addInventoryItem}
                        />
                    </div>

                    {/* ✅ CENTER BOARD */}
                    <div className="flex items-center justify-center w-full">
                        {/* กล่องบอร์ด: จำกัดตามทั้งความกว้างและความสูงของจอ */}
                        <div className="w-[min(98vw,1500px)] h-[min(82vh,1500px)]">
                            <BoardSVG
                                rows={8}
                                cols={8}
                                size={60}        // ✅ อย่าใช้ 15; ใช้ 48–60 จะสวยและไม่เพี้ยน
                                padding={50}     // ✅ 30–50 กำลังดี
                                selected={game.selected}
                                spawnZone={spawnZone}
                                activePlayer={game.activePlayer}
                                onHexClick={onHexClick}
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom controls */}
            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
                <button
                    onClick={endTurn}
                    className="arcane-pill arcane-pill--gold arcane-button px-10 py-4 text-sm md:text-base font-semibold"
                >
                    END TURN
                </button>
            </div>

            {/* back */}
            {onBack && (
                <div className="fixed bottom-6 left-6 z-20">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-black/35 border border-white/10 hover:bg-black/45"
                    >
                        <img
                            src="/back.png"
                            alt="Back"
                            className="h-10 w-auto md:h-12"
                            draggable="false"
                        />
                    </button>
                </div>
            )}
        </div>
    )
}