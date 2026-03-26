import { BackButton, PageShell } from "../components/layout"
import { ASSETS } from "../constants/assets"

function RuleSection({ title, items }) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-6 transition hover:bg-white/[0.12]">
      <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
      <ul className="space-y-2 text-gray-200 leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-1 text-cyan-300">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function RulesPage({ onBack }) {
  return (
    <PageShell
      bg={ASSETS.homeBg}
      maxWidthClass="max-w-[1400px]"
      innerClassName="relative h-full overflow-hidden px-6 py-6 sm:px-8"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <BackButton onClick={onBack} label="Back" />
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">How to Play</h1>
          </div>
          <div aria-hidden className="w-14" />
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-[rgba(6,10,24,0.72)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <RuleSection
            title="Game Overview"
            items={[
              "KOMBAT is a turn-based strategy game played by 2 players.",
              "The battlefield is an 8x8 hex board.",
              "Your goal is to eliminate enemy minions or win when endgame scoring is compared.",
            ]}
          />

          <RuleSection
            title="Turn Flow"
            items={[
              "Gain budget and apply interest at the start of the turn.",
              "Buy a new hex if you want to expand your territory.",
              "Spawn a minion on an allowed hex if you choose to.",
              "All of your minions execute their strategy in order.",
              "After all actions resolve, the turn switches to the other player.",
            ]}
          />

          <RuleSection
            title="Budget"
            items={[
              "Budget increases every turn.",
              "Interest is applied to your budget.",
              "Your budget cannot exceed the configured maximum budget.",
            ]}
          />

          <RuleSection
            title="Actions"
            items={[
              "Move: costs 1 budget, and an invalid move still costs budget.",
              "Shoot: cost is x + 1, deals damage based on target defense, and can hit allies.",
              "Done: ends the current minion action immediately.",
            ]}
          />

          <RuleSection
            title="Win Condition"
            items={[
              "Destroy all enemy minions to win immediately.",
              "If the game reaches the endgame limit, compare alive minion count first.",
              "If still tied, compare total HP.",
              "If still tied again, compare remaining budget.",
            ]}
          />
        </div>
      </div>
    </PageShell>
  )
}
