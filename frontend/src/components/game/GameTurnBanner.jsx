/** Turn / player strip — compact status summary for the battle screen. */
export default function GameTurnBanner({
  turnNumber,
  activePlayer,
}) {
  return (
    <div className="relative mx-auto w-full max-w-[620px] rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(3,7,18,0.92)_0%,rgba(29,36,77,0.86)_45%,rgba(18,72,120,0.72)_100%)] px-8 py-5 text-center shadow-[0_24px_80px_rgba(2,6,23,0.45),0_0_30px_rgba(96,165,250,0.12)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_48%)]" />
      <div className="relative flex flex-col items-center gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/50">Battle</p>
          <p className="mt-1 text-base uppercase tracking-[0.2em] text-white/85">Turn {turnNumber}</p>
          <p className="mt-2 text-3xl font-bold uppercase tracking-[0.1em] text-white drop-shadow-[0_0_18px_rgba(191,219,254,0.45)] md:text-4xl">
            Player {activePlayer === "P1" ? "1" : "2"}
          </p>
        </div>
      </div>
    </div>
  )
}
