import { useState, useEffect } from "react"
import TitleBanner from "../components/TitleBanner"

const MINIONS = [
    { id: "palrose", label: "Palrose", imageUrl: "/minion-paladin.png" },
    { id: "robolo", label: "Robolo", imageUrl: "/minion-robot.png" },
    { id: "stony", label: "Stony", imageUrl: "/minion-assassin.png" },
    { id: "warrior", label: "Warrior", imageUrl: "/minion-priest.png" },
    { id: "celeb", label: "Celeb", imageUrl: "/minion-mage.png" },
]

// แปลง "I", "II" เป็นตัวเลข
function toAllowedCount(minionType) {
    const normalized = String(minionType || "").trim().toUpperCase()
    const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
    if (romanMap[normalized]) return romanMap[normalized]
    const numeric = parseInt(normalized, 10)
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) return numeric
    return 1
}

export default function ChooseMinionPage({ minionType, gameMode = "DUEL", onBack, onContinue }) {
    const [selectedMinions, setSelectedMinions] = useState([])
    const [p1Confirmed, setP1Confirmed] = useState(false)
    const [p2Confirmed, setP2Confirmed] = useState(false)
    const [limitMessage, setLimitMessage] = useState("")

    const allowedCount = toAllowedCount(minionType)
    const selectionComplete = selectedMinions.length === allowedCount
    const isDuel = gameMode === "DUEL"

    // เงื่อนไขการกดปุ่ม Continue (ถ้าเล่นคนเดียว หรือบอทเล่น เช็คแค่ P1)
    const isReadyToContinue = isDuel ? (p1Confirmed && p2Confirmed) : p1Confirmed

    const selectedNames = MINIONS
        .filter((m) => selectedMinions.includes(m.id))
        .map((m) => m.label)

    // สุ่มตัวละครเมื่อเป็นโหมด AUTO
    useEffect(() => {
        if (gameMode === "AUTO") {
            const shuffled = [...MINIONS].sort(() => 0.5 - Math.random())
            const randomPicks = shuffled.slice(0, allowedCount).map(m => m.id)
            setSelectedMinions(randomPicks)
            setP1Confirmed(true) // ยืนยันให้เลย
        }
    }, [gameMode, allowedCount])

    const handleCardClick = (id) => {
        if (gameMode === "AUTO") return // โหมดออโต้ห้ามเปลี่ยนตัว

        setSelectedMinions((prev) => {
            if (prev.includes(id)) {
                setLimitMessage("")
                return prev.filter((item) => item !== id)
            }
            if (prev.length >= allowedCount) {
                setLimitMessage(
                    `You can only choose ${allowedCount} minion(s). Unselect one first.`
                )
                return prev
            }
            setLimitMessage("")
            return [...prev, id]
        })

        if (p1Confirmed) setP1Confirmed(false)
        if (p2Confirmed) setP2Confirmed(false)
    }

    const handleContinueClick = () => {
        if (!selectionComplete || !isReadyToContinue) return

        // ส่ง Array ข้อมูลมินเนี่ยนที่ถูกเลือกกลับไปให้ App.jsx
        const selectedMinionObjects = MINIONS.filter((minion) =>
            selectedMinions.includes(minion.id)
        ).map((minion, index) => ({
            id: index + 1, // จัดเรียง ID ใหม่ให้เรียง 1, 2, 3 ตามที่ StrategyPage ต้องการ
            baseId: minion.id,
            label: minion.label,
            imageUrl: minion.imageUrl,
        }))

        onContinue(selectedMinionObjects)
    }

    return (
        <div className="relative h-screen overflow-hidden flex flex-col bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
            <div className="absolute inset-0 bg-black/55 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 pt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-white/60 hover:bg-black/60"
                    >
                        <img src="/back.png" alt="Back" className="h-10 w-auto md:h-12" draggable="false" />
                    </button>
                </div>

                <TitleBanner title="CHOOSE MINION" />

                <div className="px-6">
                    <p className="mt-2 text-center text-sm font-semibold tracking-wide text-white/80 md:text-base">
                        {gameMode === "AUTO" ? "Auto Mode has picked your roster." : `Choose ${allowedCount} minion(s)`}
                    </p>
                    <p className="mt-2 text-center text-xs font-semibold tracking-wide text-white/80 md:text-sm">
                        Selected: {selectedNames.length ? selectedNames.join(", ") : "(none)"}
                    </p>
                    {limitMessage && (
                        <p className="mt-2 text-center text-xs font-semibold tracking-wide text-amber-200">
                            {limitMessage}
                        </p>
                    )}
                </div>

                {/* แผงรังผึ้ง / การ์ด */}
                <div className="flex-1 overflow-auto px-8 pb-32 flex items-center justify-center">
                    <div className="w-full max-w-6xl">
                        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                            {MINIONS.map((minion) => {
                                const isSelected = selectedMinions.includes(minion.id)
                                return (
                                    <button
                                        key={minion.id}
                                        type="button"
                                        onClick={() => handleCardClick(minion.id)}
                                        className={`relative flex w-full flex-col items-center rounded-2xl bg-white p-3 transition duration-200 hover:-translate-y-1 ${
                                            isSelected
                                                ? "ring-4 ring-amber-300/80 shadow-[0_0_30px_rgba(255,215,120,0.35)] scale-[1.02]"
                                                : "shadow-lg hover:shadow-2xl"
                                        } ${gameMode === "AUTO" && !isSelected ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                                    >
                                        {isSelected && (
                                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-black shadow">
                                                ✓
                                            </span>
                                        )}
                                        <div className="w-full rounded-xl bg-white p-2">
                                            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
                                                <img src={minion.imageUrl} alt={minion.label} className="h-full w-full object-contain" draggable="false" />
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center font-['Cinzel'] text-lg font-semibold tracking-wider text-amber-800">
                                            {minion.label}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* ส่วนปุ่มกดด้านล่าง */}
                <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-center items-center gap-8 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => { if (selectionComplete && gameMode !== "AUTO") setP1Confirmed(!p1Confirmed) }}
                            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                p1Confirmed ? "border-amber-400 bg-amber-500 text-black" : "border-white/30 bg-black/40 text-white"
                            }`}
                        >
                            {isDuel ? "OK (P1)" : "CONFIRM"}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleContinueClick}
                        disabled={!selectionComplete || !isReadyToContinue}
                        className={`rounded-md border px-10 py-3 text-lg font-bold tracking-widest transition ${
                            selectionComplete && isReadyToContinue
                                ? "border-amber-300 bg-amber-300 text-black shadow-[0_0_20px_rgba(253,230,138,0.5)] hover:scale-105"
                                : "border-white/20 bg-black/30 text-white/40"
                        }`}
                    >
                        CONTINUE
                    </button>

                    {isDuel && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => { if (selectionComplete) setP2Confirmed(!p2Confirmed) }}
                                className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                    p2Confirmed ? "border-sky-400 bg-sky-500 text-white" : "border-white/30 bg-black/40 text-white"
                                }`}
                            >
                                OK (P2)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}