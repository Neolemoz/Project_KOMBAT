import TitleBanner from "../components/TitleBanner"

export default function ModeSelectPage({ onBack, onSelectMode }) {
    const modes = [
        { key: "DUEL", label: "DUEL", img: "/mode-duel.png" },
        { key: "SOLITAIRE", label: "SOLITAIRE", img: "/mode-solo.png" },
        { key: "AUTO", label: "AUTO", img: "/mode-auto.png" },
    ]

    return (
        <div className="relative h-screen overflow-hidden flex flex-col bg-[url('/mode-bg.png')] bg-cover bg-center bg-no-repeat">
            <div className="absolute inset-0 bg-black/55 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 pt-6">
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-md border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-white/60 hover:bg-black/60"
                        >
                            <img
                                src="/back.png"
                                alt="Back"
                                className="h-10 w-auto md:h-12"
                                draggable="false"
                            />
                        </button>
                    </div>
                </div>

                <TitleBanner title="SELECT MODE" />

                <div className="flex-1 px-6 pb-6 flex items-center justify-center">
                    <div className="w-full max-w-6xl">
                        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
                            {modes.map((mode) => (
                                <button
                                    key={mode.key}
                                    type="button"
                                    onClick={() => onSelectMode(mode.key)}
                                    className="group flex w-full flex-col items-center rounded-2xl bg-white/90 p-4 transition hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ width: "clamp(240px, 22vw, 320px)" }}
                                >
                                    <div
                                        className="w-full overflow-hidden rounded-xl bg-white"
                                        style={{ height: "clamp(260px, 34vh, 380px)" }}
                                    >
                                        <img
                                            src={mode.img}
                                            alt={mode.label}
                                            className="h-full w-full object-contain"
                                            draggable="false"
                                        />
                                    </div>
                                    <div className="mt-4 text-center font-['Cinzel'] text-xl font-semibold tracking-widest text-amber-800">
                                        {mode.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}