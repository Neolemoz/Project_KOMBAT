import { PageShell } from "../components/layout"
import { ASSETS } from "../constants/assets"

function buildWinnerLabel(winner) {
  if (winner === 1) return "Player 1 Wins"
  if (winner === 2) return "Player 2 Wins"
  return "Draw"
}

function buildSubtitle(winner) {
  if (winner === 1) return "Player 1 controls the battlefield at the final whistle."
  if (winner === 2) return "Player 2 survives the war and claims the arena."
  return "Both armies finished dead even. No side could break the stalemate."
}

function StatCard({ label, value, accentClass = "text-white" }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-black ${accentClass}`}>{value}</p>
    </div>
  )
}

function PlayerSummary({ title, units, hp, budget, active }) {
  return (
    <div
      className={[
        "rounded-[30px] border p-6 backdrop-blur-xl",
        active
          ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.26em] text-cyan-100/75">{title}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Alive Units" value={units} accentClass="text-cyan-100" />
        <StatCard label="Total HP" value={hp} accentClass="text-emerald-200" />
        <StatCard label="Budget" value={budget} accentClass="text-amber-200" />
      </div>
    </div>
  )
}

export default function EndgamePage({
  winner = 3,
  turnNumber = 1,
  summary = { P1: { units: 0, hp: 0, budget: 0 }, P2: { units: 0, hp: 0, budget: 0 } },
  onPlayAgain,
  onHome,
}) {
  const winnerLabel = buildWinnerLabel(winner)
  const subtitle = buildSubtitle(winner)

  return (
    <PageShell
      bg={ASSETS.battleBg}
      maxWidthClass="max-w-[1600px]"
      innerClassName="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(2,6,23,0.86)_38%,_rgba(2,6,23,0.96)_100%)]" />
      <div className="absolute left-[12%] top-[18%] h-52 w-52 rounded-full bg-cyan-300/10 blur-[120px]" />
      <div className="absolute right-[10%] top-[64%] h-56 w-56 rounded-full bg-orange-300/10 blur-[140px]" />

      <div className="relative z-10 flex h-full flex-col justify-center">
        <section className="mx-auto w-full max-w-[1180px] rounded-[40px] border border-white/10 bg-[rgba(4,10,24,0.74)] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/70">Endgame</p>
            <h1 className="mt-4 text-5xl font-black tracking-[0.08em] text-white sm:text-6xl">
              {winnerLabel}
            </h1>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">{subtitle}</p>
            <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
              Final Turn {turnNumber}
            </div>
          </div>

          <div className="mt-10 grid gap-5">
            <PlayerSummary
              title="Player 1"
              units={summary.P1?.units ?? 0}
              hp={summary.P1?.hp ?? 0}
              budget={summary.P1?.budget ?? 0}
              active={winner === 1}
            />
            <PlayerSummary
              title="Player 2"
              units={summary.P2?.units ?? 0}
              hp={summary.P2?.hp ?? 0}
              budget={summary.P2?.budget ?? 0}
              active={winner === 2}
            />
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded-2xl bg-orange-500 px-8 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onHome}
              className="rounded-2xl border border-white/10 bg-white/6 px-8 py-4 font-semibold text-white transition hover:bg-white/12"
            >
              Back To Home
            </button>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
