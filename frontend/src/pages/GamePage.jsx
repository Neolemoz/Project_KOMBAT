export default function GamePage({ mode, minionType, selectedMinions = [] }) {
  const selectionList = selectedMinions.length
    ? selectedMinions.join(", ")
    : "-"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold tracking-widest">GAME SCREEN</h1>

      <div className="text-lg opacity-80">
        Mode: <span className="font-semibold">{mode || "NONE"}</span>
      </div>

      <div className="text-lg opacity-80">
        Minion Type: <span className="font-semibold">{minionType || "-"}</span>
      </div>

      <div className="text-lg opacity-80">
        Selected Minions: <span className="font-semibold">{selectionList}</span>
      </div>
    </div>
  )
}
