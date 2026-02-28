import { useState, useEffect } from "react"
import TitleBanner from "../components/TitleBanner"

const TYPES = ["I", "II", "III", "IV", "V"]

export default function MinionTypePage({ onBack, onConfirm, gameMode = "DUEL" }) {
    const [selectedType, setSelectedType] = useState("I")
    const [p1Confirmed, setP1Confirmed] = useState(false)
    const [p2Confirmed, setP2Confirmed] = useState(false)

    // ตรวจสอบว่าเป็นโหมดเล่นสองคนหรือไม่
    const isDuel = gameMode === "DUEL"

    // ถ้าเป็น DUEL ต้องกดทั้งคู่ ถ้าเป็น SOLO/AUTO กดแค่คนเดียว
    const canContinue = isDuel ? (p1Confirmed && p2Confirmed) : p1Confirmed

    // ถ้าเป็นโหมด AUTO ให้สุ่มจำนวนตอนที่โหลดหน้านี้ขึ้นมาเลย
    useEffect(() => {
        if (gameMode === "AUTO") {
            const randomType = TYPES[Math.floor(Math.random() * TYPES.length)]
            setSelectedType(randomType)
        }
    }, [gameMode])

    const handleSelect = (type) => {
        // ถ้าเป็นโหมด AUTO จะไม่ให้ผู้เล่นเปลี่ยนค่าเอง
        if (gameMode === "AUTO") return

        if (type !== selectedType) {
            setSelectedType(type)
        }
        if (p1Confirmed) setP1Confirmed(false)
        if (p2Confirmed) setP2Confirmed(false)
    }

    return (
        <div className="relative h-screen overflow-hidden flex flex-col bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
            <div className="absolute inset-0 bg-black/55 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 pt-6">
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-white/60 hover:bg-black/60"
                        >
                            <img src="/back.png" alt="Back" className="h-10 w-auto md:h-12" draggable="false" />
                        </button>
                    </div>
                </div>

                <TitleBanner title="MINION TYPE" />
                <p className="text-center text-white/80 font-semibold tracking-wide mt-2">
                    {gameMode === "AUTO"
                        ? "Auto mode has randomly selected the number of types for you."
                        : "Select the number of distinct minion types to be used."}
                </p>

                <div className="flex-1 flex items-center justify-center">
                    <div className="flex gap-4 md:gap-8">
                        {TYPES.map((type) => {
                            const isSelected = type === selectedType
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleSelect(type)}
                                    className={`relative flex h-20 w-16 items-center justify-center rounded-xl border-2 text-2xl font-bold transition duration-200 md:h-28 md:w-24 md:text-4xl ${
                                        isSelected
                                            ? "border-amber-300 bg-amber-200 text-slate-900 shadow-[0_0_20px_rgba(253,230,138,0.5)] scale-110"
                                            : "border-white/20 bg-black/40 text-white/60 hover:border-white/50 hover:bg-black/60"
                                    } ${gameMode === "AUTO" && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {type}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mb-12 flex flex-col items-center gap-6">
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedType)}
                        disabled={!canContinue}
                        className={`h-12 min-w-[160px] rounded-xl border-2 text-sm font-bold tracking-widest shadow-lg transition duration-200 ${
                            canContinue
                                ? "border-amber-300 bg-amber-200 text-slate-900 hover:bg-amber-100 hover:scale-[1.03]"
                                : "border-white/30 bg-white/10 text-white/60 opacity-40 cursor-not-allowed"
                        }`}
                    >
                        CONTINUE
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {/* ปุ่ม P1 (หรือปุ่ม CONFIRM สำหรับเล่นคนเดียว/บอท) */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setP1Confirmed((prev) => !prev)}
                                className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                    p1Confirmed ? "border-amber-400 bg-amber-500 text-black" : "border-white/30 bg-white/10 text-white"
                                }`}
                            >
                                {isDuel ? "OK (P1)" : "CONFIRM"}
                            </button>
                            {p1Confirmed && <span className="text-amber-300 font-semibold tracking-wide">Ready</span>}
                        </div>

                        {/* ปุ่ม P2 (จะแสดงเฉพาะตอนที่เป็น DUEL เท่านั้น) */}
                        {isDuel && (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setP2Confirmed((prev) => !prev)}
                                    className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                        p2Confirmed ? "border-sky-400 bg-sky-500 text-white" : "border-white/30 bg-white/10 text-white"
                                    }`}
                                >
                                    OK (P2)
                                </button>
                                {p2Confirmed && <span className="text-sky-300 font-semibold tracking-wide">Ready</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}