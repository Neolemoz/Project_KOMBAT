import { useState } from "react"
import TitleBanner from "../components/TitleBanner"

const TYPES = ["I", "II", "III", "IV", "V"]

export default function MinionTypePage({ onBack, onConfirm }) {
    const [selectedType, setSelectedType] = useState("I")
    const [p1Confirmed, setP1Confirmed] = useState(false)
    const [p2Confirmed, setP2Confirmed] = useState(false)

    const canContinue = p1Confirmed && p2Confirmed

    const handleSelect = (type) => {
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
                            <img
                                src="/back.png"
                                alt="Back"
                                className="h-10 w-auto md:h-12"
                                draggable="false"
                            />
                        </button>
                    </div>
                </div>

                <TitleBanner title="MINION TYPE" />

                <div className="px-6">
                    <p className="mt-2 text-center text-lg font-semibold tracking-wider text-white md:text-xl">
                        You are selecting: {selectedType} type
                    </p>
                </div>

                <div className="flex-1 overflow-auto px-8 pb-32">
                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-6xl">
                            <div className="flex w-full flex-row flex-nowrap justify-center gap-6 md:gap-10 lg:gap-12">
                                {TYPES.map((type) => {
                                    const isSelected = type === selectedType
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleSelect(type)}
                                            aria-pressed={isSelected}
                                            className={`flex h-[220px] w-[150px] shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 text-4xl font-bold transition duration-200 md:h-[240px] md:w-[160px] md:text-5xl lg:h-[270px] lg:w-[190px] lg:text-6xl ${
                                                isSelected
                                                    ? "!bg-purple-600 !text-white ring-4 ring-amber-300/90 shadow-[0_0_35px_rgba(255,215,120,0.45)]"
                                                    : "!bg-white !text-slate-900 border-white/80 shadow-lg hover:-translate-y-2 hover:shadow-2xl hover:border-amber-300"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-between items-center z-20">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setP1Confirmed((prev) => !prev)}
                            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                p1Confirmed
                                    ? "border-emerald-400 bg-emerald-500 text-white"
                                    : "border-white/30 bg-white/10 text-white"
                            }`}
                        >
                            OK (P1)
                        </button>
                        {p1Confirmed && (
                            <span className="text-emerald-300 font-semibold tracking-wide">
                Confirmed
              </span>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={!p1Confirmed || !p2Confirmed}
                        onClick={() => onConfirm(selectedType)}
                        className={`h-12 min-w-[160px] rounded-xl border-2 text-sm font-bold tracking-widest shadow-lg transition duration-200 ${
                            canContinue
                                ? "border-amber-300 bg-amber-200 text-slate-900 hover:bg-amber-100 hover:scale-[1.03]"
                                : "border-white/30 bg-white/10 text-white/60 opacity-40 cursor-not-allowed"
                        }`}
                    >
                        CONTINUE
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setP2Confirmed((prev) => !prev)}
                            className={`rounded-md border px-6 py-2 text-sm font-semibold tracking-wide transition ${
                                p2Confirmed
                                    ? "border-sky-400 bg-sky-500 text-white"
                                    : "border-white/30 bg-white/10 text-white"
                            }`}
                        >
                            OK (P2)
                        </button>
                        {p2Confirmed && (
                            <span className="text-sky-300 font-semibold tracking-wide">
                Confirmed
              </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}