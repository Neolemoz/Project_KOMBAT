import { useState } from "react"
import HomePage from "./pages/Home"
import ModeSelectPage from "./pages/ModeSelectPage"
import MinionTypePage from "./pages/MinionTypePage"
import ChooseMinionPage from "./pages/ChooseMinionPage"
import GamePage from "./pages/GamePage"

export default function App() {
  const [page, setPage] = useState("home")
  const [mode, setMode] = useState(null)
  const [minionType, setMinionType] = useState(null)
  const [selectedMinions, setSelectedMinions] = useState([])

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
          setPage("chooseMinion")
        }}
      />
    )
  }

  if (page === "chooseMinion") {
    return (
      <ChooseMinionPage
        minionType={minionType}
        onBack={() => setPage("minionType")}
        onContinue={(payload) => {
          setSelectedMinions(payload.selectedMinions)
          setPage("game")
        }}
      />
    )
  }

  return (
    <GamePage
      mode={mode}
      minionType={minionType}
      selectedMinions={selectedMinions}
    />
  )
}
