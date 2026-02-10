export default function Home({ onStart }) {
    return (
        <div
            className="min-h-screen bg-cover bg-center flex items-center justify-center relative overflow-hidden"
            style={{ backgroundImage: "url(/bg.jpg)" }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative flex flex-col items-center space-y-12">

                {/* Rune Title */}
                <div
                    className="font-['Cinzel_Decorative'] text-[110px] leading-[1.1] tracking-widest text-center
             text-transparent bg-clip-text
             bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-400
             animate-fadeIn"
                    style={{
                        WebkitTextStroke: "2px #facc15",
                        textShadow: `
      0 0 8px #facc15,
      
      
    `
                    }}
                >
                    KOMBAT
                    <br />
                    GAME
                </div>

                {/* START BOX */}
                <div className="bg-black/40 backdrop-blur-md border border-purple-400/40
                        px-14 py-8 rounded-[32px]
                        shadow-[0_0_30px_rgba(168,85,247,0.4)]
                        animate-fadeInSlow">
                    <button
                        onClick={() => onStart("DUEL")}
                        className="w-72 py-4 rounded-full
                       bg-gradient-to-r from-purple-600 to-indigo-600
                       text-white text-xl font-semibold
                       hover:scale-105 transition-all duration-200
                       shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                        START GAME
                    </button>
                </div>

                {/* RULES BOX */}
                <div className="bg-black/40 backdrop-blur-md border border-indigo-400/40
                        px-14 py-8 rounded-[32px]
                        shadow-[0_0_30px_rgba(99,102,241,0.4)]
                        animate-fadeInSlow">
                    <button
                        onClick={() => onStart("RULES")}
                        className="w-72 py-4 rounded-full
                       bg-gradient-to-r from-indigo-600 to-purple-600
                       text-white text-xl font-semibold
                       hover:scale-105 transition-all duration-200
                       shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                        RULES
                    </button>
                </div>

            </div>

            {/* Animation */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 600ms ease-out both; }
        .animate-fadeInSlow { animation: fadeIn 900ms ease-out both; }
      `}</style>
        </div>
    )
}