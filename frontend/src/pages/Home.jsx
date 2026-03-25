import { useMemo } from "react"
import { PageShell } from "../components/layout"
import { ASSETS } from "../constants/assets"

export default function Home({ onStart }) {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${4 + Math.random() * 6}s`,
      delay: `${Math.random() * 3}s`,
    }))
  }, [])

  return (
    <PageShell bg={ASSETS.homeBg} innerClassName="relative h-full max-w-none overflow-hidden px-6 py-6 sm:px-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="animate-float absolute h-1 w-1 rounded-full bg-white/60 blur-sm"
            style={{
              top: particle.top,
              left: particle.left,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center">
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[140px]" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <h1
            className="
              text-5xl font-bold tracking-[0.2em] text-white
              drop-shadow-[0_0_20px_rgba(150,200,255,0.7)]
              sm:text-6xl
            "
          >
            KOMBAT
          </h1>

          <p
            className="
              max-w-md text-lg tracking-wide text-white/80
            "
          >
            Enter the arena. Command your minions. Dominate the battle.
          </p>

          <div className="mt-2 flex w-full max-w-sm flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => onStart("DUEL")}
              className="
                group relative mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600
                px-10 py-4 text-white font-semibold tracking-wide
                shadow-[0_0_25px_rgba(120,120,255,0.6)]
                transition-all duration-300
                hover:scale-105 active:scale-95
                before:absolute before:inset-0 before:rounded-xl
                before:border before:border-white/20
                before:opacity-0 before:transition
                hover:before:opacity-100
                hover:before:shadow-[0_0_20px_rgba(150,200,255,0.8)]
              "
            >
              <span className="relative z-10">START GAME</span>
              <span
                className="
                  pointer-events-none absolute inset-0 rounded-xl
                  bg-gradient-to-r from-cyan-400 to-purple-500
                  opacity-0 blur-md transition duration-300
                  group-hover:opacity-60
                "
              />
            </button>

            <button
              type="button"
              onClick={() => onStart("RULES")}
              className="
                relative mt-2 rounded-lg border border-white/10
                bg-white/10 px-6 py-2 text-white/80 backdrop-blur-md
                transition hover:bg-white/20
                hover:shadow-[0_0_15px_rgba(150,200,255,0.5)]
                before:absolute before:inset-0 before:rounded-xl
                before:border before:border-white/20
                before:opacity-0 before:transition
                hover:before:opacity-100
                hover:before:shadow-[0_0_20px_rgba(150,200,255,0.8)]
              "
            >
              RULES
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
