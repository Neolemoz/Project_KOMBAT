import { useEffect, useMemo, useState } from "react"
import { defineMinionType, startGame } from "../api/gameApi"
import TitleBanner from "../components/TitleBanner"
import MinionSidebar from "../components/MinionSidebar"
import StrategyForm from "../components/StrategyForm"
import { validateStrategy } from "../api/gameApi"

const emptyConfig = { name: "", defense: "", strategy: "" }

// ✅ Sidebar sizing (AAA layout)
const SIDEBAR_W = 320
const SIDEBAR_GAP = 40 // = left-6
const SAFE_RIGHT_PADDING = 80 // (unused now, keep if you need later)

function isFilled(value) {
    return String(value || "").trim().length > 0
}

export default function MinionStrategyPage({
                                               selectedMinions = [],
                                               configs ,
                                               onUpdateConfig,
                                               onBack,
                                               onFinishAll,
                                           }) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [drafts, setDrafts] = useState({})
    const [validateLoading, setValidateLoading] = useState(false)
    const [validateResult, setValidateResult] = useState(null)

    useEffect(() => {
        if (!selectedMinions.length) return
        setSelectedIndex((prev) => {
            if (prev < 0) return 0
            if (prev >= selectedMinions.length) return selectedMinions.length - 1
            return prev
        })
    }, [selectedMinions])

    useEffect(() => {
        if (!selectedMinions.length) return
        setDrafts((prev) => {
            let isChanged = false
            const next = { ...prev }
            selectedMinions.forEach((minion) => {
                if (!next[minion.id]) {
                    next[minion.id] = {
                        name: minion.label || "",
                        defense: "",
                        strategy: "",
                        ...(configs && configs[minion.id] ? configs[minion.id] : {}),
                    }
                    isChanged = true // พบว่ามีมินเนี่ยนตัวใหม่เพิ่งถูกเพิ่ม
                }
            })
            // ถ้าไม่มีอะไรเปลี่ยนแปลง ให้ return prev ตัวเดิม (แก้บั๊ก Loop เด็ดขาด)
            return isChanged ? next : prev
        })
    }, [selectedMinions, configs])

    const completionById = useMemo(() => {
        const map = {}
        selectedMinions.forEach((minion) => {
            const config = drafts[minion.id] || emptyConfig
            map[minion.id] =
                isFilled(config.name) &&
                isFilled(config.defense) &&
                isFilled(config.strategy)
        })
        return map
    }, [drafts, selectedMinions])

    const activeMinion = useMemo(() => {
        return selectedMinions[selectedIndex] || null
    }, [selectedIndex, selectedMinions])

    useEffect(() => {
        setValidateResult(null)
    }, [selectedIndex])

    const { completedCount, allComplete } = useMemo(() => {
        const ids = selectedMinions.map((minion) => minion.id)
        const count = ids.filter((id) => {
            const config = drafts[id]
            return (
                config &&
                config.name?.trim() &&
                String(config.defense ?? "").trim() &&
                config.strategy?.trim()
            )
        }).length
        return {
            completedCount: count,
            allComplete: ids.length > 0 && count === ids.length,
        }
    }, [drafts, selectedMinions])

    if (!selectedMinions.length) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 text-white">
                <h1 className="text-2xl font-semibold">No minions selected.</h1>
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-md border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-wider"
                >
                    <img
                        src="/back.png"
                        alt="Back to Selection"
                        className="h-10 w-auto md:h-12"
                        draggable="false"
                    />
                </button>
            </div>
        )
    }

    const activeConfig = activeMinion
        ? drafts[activeMinion.id] || emptyConfig
        : emptyConfig

    const handleValidate = async () => {
        if (!activeMinion) return
        setValidateLoading(true)
        setValidateResult(null)
        try {
            const response = await validateStrategy({
                gameId: null,
                minionType: activeMinion.label || activeMinion.id,
                strategy: activeConfig.strategy ?? "",
            })
            if (response && response.ok === false) {
                setValidateResult({
                    ok: false,
                    message: response.error || response.message || "Invalid strategy",
                })
            } else {
                setValidateResult({
                    ok: true,
                    message: response?.message || "Valid",
                })
            }
        } catch (error) {
            setValidateResult({
                ok: false,
                message: error?.message || "Validation failed",
            })
        } finally {
            setValidateLoading(false)
        }
    }

    // keep (not used after centering change, but harmless)
    const leftPx = SIDEBAR_GAP + SIDEBAR_W

    const [isFinishing, setIsFinishing] = useState(false)
    const [globalError, setGlobalError] = useState(null)

    // ฟังก์ชันนี้จะทำงานเมื่อกดปุ่ม FINISH ด้านขวาล่าง
    const handleFinishClick = async () => {
        setIsFinishing(true)
        setGlobalError(null)

        try {
            // 🌟 แก้ไข: ย้าย startGame มาไว้บรรทัดแรกสุด!
            // เพื่อสั่งให้ Backend เคลียร์ข้อมูล Minion เก่าที่อาจค้างอยู่ออกไปก่อน
            await startGame("duel") // (ถ้าอนาคตมีรับค่า mode จาก props ก็เปลี่ยน "duel" เป็นตัวแปร mode ได้ครับ)

            // 1. วนลูปตรวจสอบและสร้าง Minion ทีละชนิดตามจำนวนที่เลือกไว้
            for (let i = 0; i < selectedMinions.length; i++) {
                const minionId = selectedMinions[i].id
                const config = drafts[minionId] || emptyConfig

                // เช็คว่ากรอกข้อมูลครบไหม
                if (!config.name || !config.defense || !config.strategy) {
                    throw new Error(`Minion Type ${i + 1} is missing information!`)
                }

                // ยิง API สร้าง Minion
                const hp = 100
                const success = await defineMinionType(
                    config.name,
                    Number(hp),
                    Number(config.defense),
                    config.strategy
                )

                if (!success) {
                    // ถ้ามาพังตรงนี้ แสดงว่าเป็นที่เรื่อง Syntax ของ Strategy แน่นอน 100%
                    throw new Error(`Syntax Error for ${config.name}! Please check your Strategy script.`)
                }
            }

            // 2. เปลี่ยนหน้าจอไปที่ GamePage
            if (onFinishAll) onFinishAll(drafts)

        } catch (err) {
            setGlobalError(err.message)
            alert(err.message)
        } finally {
            setIsFinishing(false)
        }
    }
    return (
        <div className="relative min-h-screen overflow-hidden bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
            <div className="pointer-events-none absolute inset-0 bg-black/60" />

            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="pointer-events-none fixed top-2 left-0 right-0 z-20 flex justify-center px-4">
                    <div className="w-full max-w-5xl">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <TitleBanner
                                title="MINION STRATEGY"
                                className="scale-[1.05] md:scale-[1.1] lg:scale-[1.15]"
                            />
                            <p className="text-[11px] font-semibold tracking-wide text-white/80 md:text-xs">
                                Configure each minion before entering the arena.
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200 md:text-xs">
                                {completedCount}/{selectedMinions.length} COMPLETE
                            </p>
                        </div>
                    </div>
                </header>

                <main className="relative z-10 flex flex-1 px-4 pt-32 md:pt-36">
                    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 lg:block">
                        {/* Sidebar */}
                        <div
                            className="lg:absolute lg:top-28 lg:z-30"
                            style={{ left: SIDEBAR_GAP }}
                        >
                            <aside
                                className="w-full rounded-3xl border border-white/15 bg-black/35 backdrop-blur-md
                           shadow-[0_20px_60px_rgba(0,0,0,0.55)] lg:w-[320px]"
                                style={{ width: SIDEBAR_W }}
                            >
                                <MinionSidebar
                                    minions={selectedMinions}
                                    activeId={activeMinion?.id}
                                    completionById={completionById}
                                    onSelect={(id) => {
                                        const index = selectedMinions.findIndex(
                                            (minion) => minion.id === id
                                        )
                                        if (index >= 0) setSelectedIndex(index)
                                    }}
                                />
                            </aside>
                        </div>

                        {/* ✅ AAA Layered Center Panel */}
                        <div className="relative mx-auto w-full max-w-[1100px] lg:mt-20 lg:z-20">

                            {/* ✨ Outer glass frame */}
                            <div className="relative rounded-[40px] border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.65)] p-6 md:p-8">

                                {/* ✨ Inner white content sheet */}
                                <div className="rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5">

                                    <div className="px-10 py-10 md:px-14 md:py-12">
                                        <StrategyForm
                                            minion={activeMinion}
                                            value={activeConfig}
                                            onChange={(patch) => {
                                                if (!activeMinion) return
                                                setDrafts((prev) => {
                                                    const current = prev[activeMinion.id] || emptyConfig
                                                    return {
                                                        ...prev,
                                                        [activeMinion.id]: { ...current, ...patch },
                                                    }
                                                })
                                                onUpdateConfig?.(activeMinion.id, patch)
                                            }}
                                            onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                                            onNext={() =>
                                                setSelectedIndex((i) =>
                                                    Math.min(selectedMinions.length - 1, i + 1)
                                                )
                                            }
                                            canGoPrev={selectedIndex > 0}
                                            canGoNext={selectedIndex < selectedMinions.length - 1}
                                            onValidate={handleValidate}
                                            validateLoading={validateLoading}
                                            validateResult={validateResult}
                                        />
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                <button
                    type="button"
                    onClick={onBack}
                    className="fixed left-6 top-6 z-30 rounded-md p-1 transition hover:scale-105"
                >
                    <img
                        src="/back.png"
                        alt="Back to Selection"
                        className="h-10 w-auto md:h-12"
                        draggable="false"
                    />
                </button>

                {allComplete && (
                    <button
                        type="button"
                        onClick={handleFinishClick} // 👈 เปลี่ยนจาก () => onFinishAll?.() มาเป็นฟังก์ชันนี้
                        disabled={isFinishing}
                        className="fixed bottom-6 right-6 z-30 rounded-md border border-amber-300 bg-amber-300 px-6 py-2 text-sm font-semibold tracking-wide text-black transition hover:bg-amber-200 disabled:opacity-50"
                    >
                        {isFinishing ? "STARTING..." : "FINISH"}
                    </button>
                )}
            </div>
        </div>
    )
}