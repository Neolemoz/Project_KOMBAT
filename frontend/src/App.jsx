// frontend/src/App.jsx
import { useState } from "react"
import HomePage from "./pages/Home"
import ModeSelectPage from "./pages/ModeSelectPage"
import MinionTypePage from "./pages/MinionTypePage"
import ChooseMinionPage from "./pages/ChooseMinionPage"
import MinionStrategyPage from "./pages/MinionStrategyPage"
import GamePage from "./pages/GamePage"

export default function App() {
    const [page, setPage] = useState("home")
    const [mode, setMode] = useState(null)
    const [minionType, setMinionType] = useState(null)
    const [selectedMinions, setSelectedMinions] = useState([])
    const [configsByMinionId, setConfigsByMinionId] = useState({})
    const [minionConfigs, setMinionConfigs] = useState(null)

    const updateConfig = (minionId, patch) => {
        setConfigsByMinionId((prev) => {
            const current = prev[minionId] || {}
            return {
                ...prev,
                [minionId]: { ...current, ...patch },
            }
        })
    }

    if (page === "home") {
        return <HomePage onStart={() => setPage("mode")} />
    }

    if (page === "mode") {
        return (
            <ModeSelectPage
                onBack={() => setPage("home")}
                onSelectMode={(modeKey) => {
                    setMode(modeKey)
                    setPage("minionType")
                }}
            />
        )
    }

    if (page === "minionType") {
        return (
            <MinionTypePage
                onBack={() => setPage("mode")}
                onConfirm={(type) => {
                    setMinionType(type)
                    setPage("minionSelect")
                }}
            />
        )
    }

    if (page === "minionSelect") {
        return (
            <ChooseMinionPage
                minionType={minionType}
                onBack={() => setPage("minionType")}
                onContinue={(payload) => {
                    setSelectedMinions(payload.selectedMinions)
                    setConfigsByMinionId({})
                    setMinionConfigs(null)
                    setPage("minionStrategy")
                }}
            />
        )
    }

    if (page === "minionStrategy") {
        return (
            <MinionStrategyPage
                selectedMinions={selectedMinions}
                configs={configsByMinionId}
                onUpdateConfig={updateConfig}
                onBack={() => setPage("minionSelect")}
                onFinishAll={() => {
                    const payload = selectedMinions.map((minion) => ({
                        id: minion.id,
                        label: minion.label,
                        imageUrl: minion.imageUrl,
                        config: configsByMinionId[minion.id],
                    }))
                    setMinionConfigs(payload)
                    setPage("game")
                }}
            />
        )
    }

    // ✅ หน้าเกม + ปุ่ม back กลับ home (ขั้นต่ำตามที่ขอ)
    if (page === "game") {
        return (
            <GamePage
                onBack={() => setPage("minionStrategy")}
                minionConfigs={minionConfigs}
            />
        )
    }

    // fallback กัน page เพี้ยน
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <button
                className="px-6 py-3 rounded bg-white/10 hover:bg-white/15"
                onClick={() => setPage("home")}
            >
                Go Home
            </button>
        </div>
    )
}