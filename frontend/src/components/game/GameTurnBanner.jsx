/** Turn / player strip — typography aligned with PageTitle elsewhere. */
export default function GameTurnBanner({ turnNumber, activePlayer }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 px-5 py-3 text-center backdrop-blur-md">
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">Battle</p>
      <p className="mt-1 text-sm text-white/80">Turn {turnNumber}</p>
      <p className="mt-1 text-2xl font-bold tracking-wide text-white drop-shadow-lg md:text-3xl">
        Player {activePlayer === "P1" ? "1" : "2"}
      </p>
    </div>
  )
}
